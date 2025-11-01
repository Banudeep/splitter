package com.example.splitter.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.persistence.*;
import lombok.NoArgsConstructor;

import java.util.List;

import com.example.splitter.model.Items;

@Entity (name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bills {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "receipt_id", nullable = false)
    private Long receiptId;
    @Column(name="store_name")
    private String storeName;
    @Column(name = "store_address")
    private String storeAddress;
    private String date;
    private String time;
    @Column(name = "sub_total")
    private double subTotal;
    @Column(name = "tax_total")
    private double taxTotal;
    private double total;

    @OneToMany(mappedBy = "bills", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Items> items;
    public void setItems(List<Items> items) {
        this.items = items;
        if (items != null) {
            for (Items item : items) {
                item.setBills(this);
            }
        }
    }

    @Override
    public String toString() {
        return "Bills{" +
                "receiptId=" + receiptId +
                ", storeName='" + storeName + '\'' +
                ", storeAddress='" + storeAddress + '\'' +
                ", date='" + date + '\'' +
                ", time='" + time + '\'' +
                ", subTotal=" + subTotal +
                ", taxTotal=" + taxTotal +
                ", total=" + total +
                ", itemsCount=" + (items == null ? 0 : items.size()) +
                '}';
    }

}
