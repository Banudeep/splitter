package com.example.splitter.repo;


import com.example.splitter.model.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShareRepo extends JpaRepository<Share, String> {
    List<Share> findByReceiptId(Long receiptId);
}