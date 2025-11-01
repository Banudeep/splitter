package com.example.splitter.model;
import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Items {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;
    private double price;

    @ManyToOne
    @JoinColumn(name = "receipt_id")
    private Bills bills;

    @Override
    public String toString() {
        return "Items{" +
                "id=" + id +
                ", description='" + description + '\'' +
                ", price=" + price +
                '}';
    }
}

