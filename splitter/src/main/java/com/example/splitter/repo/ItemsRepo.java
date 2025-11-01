package com.example.splitter.repo;

import com.example.splitter.model.Bills;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.splitter.model.Items;

@Repository
public interface ItemsRepo extends JpaRepository<Items, String> {
}
