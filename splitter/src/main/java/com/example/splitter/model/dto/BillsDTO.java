package com.example.splitter.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import com.example.splitter.model.dto.ItemsDTO;

@Getter
@Setter
public class BillsDTO {

    private Long id;
    private String storeName;
    private String storeAddress;
    private String date;
    private String time;
    private double subTotal;
    private double taxTotal;
    private double total;
    private List<ItemsDTO> items;
}

