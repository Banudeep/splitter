package com.example.splitter.repo;

import com.example.splitter.model.Split;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SplitRepo extends JpaRepository<Split, String> {

    List<Split> findByReceiptId(Long receiptId);
}
