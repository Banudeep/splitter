package com.example.splitter.repo;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.splitter.model.Bills;

import java.util.Optional;

@Repository
public interface BillsRepo extends JpaRepository<Bills, String> {
//    Optional<Bills> findById(Long Id);
    Optional<Bills> findByReceiptId(Long receiptId);
}
