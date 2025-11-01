package com.example.splitter.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "split")
@ToString(exclude = "shares")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Split {

    @Id
    @Column(unique = true)
    private Long itemId;

    private Long receiptId;
    private String itemName;
    private double price;

    @OneToMany(mappedBy = "split", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Share> shares;

    public void setShares(List<Share> shares) {
        this.shares = shares;
        if (shares != null) {
            for (Share shareItem : shares) {
                shareItem.setSplit(this);
            }
        }
    }


    @Override
    public String toString() {
        return "Split{" +
                "id=" + itemId +
                ", receiptId=" + receiptId +
                ", itemId=" + itemId +
                ", itemName='" + itemName + '\'' +
                ", price=" + price +
                ", sharesCount=" + (shares == null ? 0 : shares.size()) +
                '}';
    }

}
