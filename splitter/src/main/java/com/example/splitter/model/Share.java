package com.example.splitter.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "split")
public class Share {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Double cost;
    private Double share;
    private Long itemId;
    private Long receiptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "split_id")
    @JsonIgnoreProperties({"shares", "hibernateLazyInitializer", "handler"})
    private Split split;

    @Override
    public String toString() {
        return "Share{" +
                "id=" + id +
                ", userId=" + userId +
                ", share=" + share +
                ", receiptId=" + receiptId +
                ", cost=" + cost +
                ", itemId=" + itemId +
                '}';
    }
}