package com.example.splitter.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SplitDTO {

    private Long receiptId;
    private Long productId;
    private String description;
    private double price;

}
