package com.example.splitter.controller;

import com.example.splitter.model.Share;
import com.example.splitter.model.Users;
import com.example.splitter.model.dto.ShareDTO;
import com.example.splitter.model.dto.UsersDTO;
import com.example.splitter.service.SplitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.splitter.model.Split;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/math")
@CrossOrigin(origins = "*")
public class splitController {

    @Autowired
    private SplitService splitService;

    @PostMapping("/users")
    public ResponseEntity<String> usersInSplit(@RequestBody List<UsersDTO> users) {
        // Logic to add users to the split would go here
        return splitService.usersInSplit(users);
    }

    @GetMapping("/users" )
    public ResponseEntity<Optional<List<Users>>> getUsersInSplit(@RequestParam Long receiptId) {

        return splitService.getUsersInSplit(receiptId);
    }

    @DeleteMapping("/users")
    public ResponseEntity<String> deleteUsersInSplit(@RequestParam Long receiptId, @RequestParam Long userId) {
        // Logic to delete users from the split would go here
        return splitService.deleteUsersInSplit(receiptId, userId);
    }

    @PostMapping("/share" )
    public ResponseEntity<String> shareBill(@RequestParam Long receiptId, @RequestBody List<Split> splits) {

        return splitService.shareBill(receiptId, splits);
    }

    @GetMapping("/share")
    public ResponseEntity<Optional<List<Share>>> getBillShare(@RequestParam Long receiptId) {

        return splitService.getBillShare(receiptId);
    }

    @GetMapping("/split")
    public ResponseEntity<String> getShareByReceiptId(@RequestParam Long receiptId) {

        return splitService.getShareByReceiptId(receiptId);
    }

}
