package com.example.splitter.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity (name="users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "users")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "receipt_id", nullable = false)
    private Long receiptId;
    private String name;
    private Double amount;
}
