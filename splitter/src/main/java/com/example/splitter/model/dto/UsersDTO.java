package com.example.splitter.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsersDTO {

    private Long userId;
    private Long receiptId;
    private String name;
    private Double amount;

}