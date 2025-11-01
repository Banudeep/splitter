package com.example.splitter.repo;

import com.example.splitter.model.Users;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsersRepo extends JpaRepository<Users, String> {
    List<Users> findByReceiptId(Long receiptId);

    Optional<Users> findByReceiptIdAndUserId(Long receiptId, Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM users u WHERE u.receiptId = :receiptId")
    int deleteByReceiptId(@Param("receiptId") Long receiptId);

    boolean existsByUserId(Long UserId);

    void deleteByReceiptIdAndUserId(Long receiptId, Long userId);
}
