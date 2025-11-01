package com.example.splitter.service;

import com.example.splitter.model.Bills;
import com.example.splitter.model.Share;
import com.example.splitter.model.Split;
import com.example.splitter.model.Users;
import com.example.splitter.model.dto.ShareDTO;
import com.example.splitter.model.dto.UsersDTO;
import com.example.splitter.repo.BillsRepo;
import com.example.splitter.repo.ShareRepo;
import com.example.splitter.repo.SplitRepo;
import com.example.splitter.repo.UsersRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class SplitService {

    @Autowired
    private UsersRepo usersRepo;

    @Autowired
    private SplitRepo splitRepo;

    @Autowired
    private ShareRepo shareRepo;

    @Autowired
    private BillsRepo billsRepo;

    public ResponseEntity<String> usersInSplit(List<UsersDTO> usersData){
        // Logic to process users in a split
        if (usersData == null) {
            return ResponseEntity.badRequest().body("Request body must be a non-empty JSON array of UsersDTO");
        }
        for (UsersDTO dto : usersData) {
            usersRepo.deleteByReceiptIdAndUserId(dto.getReceiptId(), dto.getUserId());
            Users users = new Users();
            users.setReceiptId(dto.getReceiptId());
            users.setUserId(dto.getUserId());
            users.setAmount(dto.getAmount());
            users.setName(dto.getName());
            usersRepo.save(users);
        }

        return ResponseEntity.ok("Users processed in split successfully");
    }

    public ResponseEntity<Optional<List<Users>>> getUsersInSplit(Long receiptId){
        // Logic to get splits by receipt ID
        List<Users> users = usersRepo.findByReceiptId(receiptId);
        if (users.isEmpty()) {
            return ResponseEntity.of(Optional.empty());
        }
        StringBuilder splits = new StringBuilder();
        for (Users user : users) {
            splits.append(user.toString()).append("\n");
        }
        return ResponseEntity.ok(Optional.of(users));
    }

    @Transactional
    public  ResponseEntity<String> deleteUsersInSplit(Long receiptId, Long userId){
        // Logic to delete users from a split
        if (!usersRepo.existsByUserId(userId)) {
            return ResponseEntity.badRequest().body("UserId " + userId + " does not exist in Users table");
        }
        usersRepo.deleteByReceiptIdAndUserId(receiptId, userId);
        return ResponseEntity.ok("User with userId: " + userId + " deleted from receiptId: " + receiptId);
    }

    public ResponseEntity<String> shareBill(Long receiptId, List<Split> splitData){
        // Logic to share bill among users
        // This is a placeholder implementation; actual logic will depend on requirements
        if (splitData == null || splitData.isEmpty()) {
            return ResponseEntity.badRequest().body("Request body must be a non-empty JSON array of Share objects");
        }

        for (Split splitItem : splitData) {
            for (Share shareDto : splitItem.getShares()) {
                if (!usersRepo.existsByUserId(shareDto.getUserId())) {
                    return ResponseEntity.badRequest().body("UserId " + shareDto.getUserId() + " does not exist in Users table");
                }
            }
            Split split = new Split();
            split.setReceiptId(receiptId);
            split.setItemId(splitItem.getItemId());
            split.setItemName(splitItem.getItemName());
            split.setPrice(splitItem.getPrice());
            double totalShares = splitItem.getShares().stream()
                    .mapToDouble(Share::getShare)
                    .sum();

            List<Share> shares = splitItem.getShares().stream().map(dto -> {
                Share share = new Share();
                share.setUserId(dto.getUserId());
                share.setShare(dto.getShare());
                share.setReceiptId(receiptId);
                double cost = 0;
                if (totalShares != 0) {
                    cost = BigDecimal.valueOf(dto.getShare())
                            .divide(BigDecimal.valueOf(totalShares), 10, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(splitItem.getPrice()))
                            .setScale(3, RoundingMode.HALF_UP)
                            .doubleValue();
                }share.setCost(cost);
                share.setSplit(split);
                share.setItemId(splitItem.getItemId());
                return share;
            }).toList();

            split.setShares(shares);
            splitRepo.save(split);
        }
        return ResponseEntity.ok("Bill shared successfully for receiptId: " + receiptId);
    }

    public ResponseEntity<Optional<List<Share>>> getBillShare(Long receiptId){
        // Logic to get bill share by receipt ID
        List<Share> shares = shareRepo.findByReceiptId(receiptId);
        System.out.println(shares);
        if (shares.isEmpty()) {
            return ResponseEntity.of(Optional.empty());
        }
        StringBuilder splits = new StringBuilder();
        for (Share share : shares) {
            splits.append(share.toString()).append("\n");
        }
        return ResponseEntity.ok(Optional.of(shares));
    }

    public ResponseEntity<String> getShareByReceiptId(Long receiptId) {
        List<Share> shares = shareRepo.findByReceiptId(receiptId);
        if (shares.isEmpty()) {
            return ResponseEntity.status(404).body("No splits found for receiptId: " + receiptId);
        }
        
        // Get bill data to access tax and subtotal information
        Optional<Bills> billOptional = billsRepo.findByReceiptId(receiptId);
        double taxTotal = 0.0;
        double totalSubtotal = 0.0;
        if (billOptional.isPresent()) {
            Bills bill = billOptional.get();
            taxTotal = bill.getTaxTotal();
            totalSubtotal = bill.getSubTotal();
        }
        
        Map<Long, Double> userSubtotalCost = new HashMap<>();
        
        // Calculate subtotal costs per user
        for (Share share : shares) {
            userSubtotalCost.merge(share.getUserId(), share.getCost(), Double::sum);
        }
        
        StringBuilder result = new StringBuilder("Total cost per user:\n");
        for (Map.Entry<Long, Double> entry : userSubtotalCost.entrySet()) {
            // Calculate proportional tax share
            double taxShare = 0.0;
            if (totalSubtotal > 0) {
                taxShare = BigDecimal.valueOf(entry.getValue())
                        .divide(BigDecimal.valueOf(totalSubtotal), 10, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(taxTotal))
                        .setScale(3, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            
            // Total cost = subtotal + tax share
            double totalCost = entry.getValue() + taxShare;
            double rounded = new BigDecimal(totalCost)
                    .setScale(3, RoundingMode.HALF_UP)
                    .doubleValue();
            
            result.append("UserId: ").append(entry.getKey())
                    .append(", Total Cost: ").append(rounded)
                    .append("\n");
        }
        
        // Add tax and total information
        result.append("Subtotal: ").append(new BigDecimal(totalSubtotal)
                .setScale(3, RoundingMode.HALF_UP).doubleValue()).append("\n");
        result.append("Tax: ").append(new BigDecimal(taxTotal)
                .setScale(3, RoundingMode.HALF_UP).doubleValue()).append("\n");
        result.append("Grand Total: ").append(new BigDecimal(totalSubtotal + taxTotal)
                .setScale(3, RoundingMode.HALF_UP).doubleValue());
        
        // Debug logging
        System.out.println("SplitService - Tax total: " + taxTotal);
        System.out.println("SplitService - Total subtotal: " + totalSubtotal);
        System.out.println("SplitService - Response: " + result.toString());
        
        return ResponseEntity.ok(result.toString());
    }
}
