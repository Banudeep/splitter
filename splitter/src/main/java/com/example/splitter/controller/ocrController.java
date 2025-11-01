package com.example.splitter.controller;

import com.example.splitter.model.dto.BillsDTO;
import com.example.splitter.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/ocr")
@CrossOrigin(origins = "*")
public class ocrController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/extract")
    public ResponseEntity<String> extractReceiptInfo(@RequestParam("file") MultipartFile file) {
        // 1. Validate file
        // 2. Send to OpenAI API (see next step)
        // 3. Return extracted info
        return ocrService.extractTextFromImage(file);
    }

    @PostMapping("/receipt")
    public ResponseEntity<Map> addReceiptInfo(@RequestBody BillsDTO json) {
        // 1. Validate file
        // 2. Send to OpenAI API (see next step)
        // 3. Return extracted info
        return ocrService.addReceiptToDatabase(json);
    }

    @PostMapping("/update_receipt")
    public ResponseEntity<Map> updateReceiptInfo(@RequestBody BillsDTO json, @RequestParam Long receiptId) {
        // 1. Validate file
        // 2. Send to OpenAI API (see next step)
        // 3. Return extracted info
        return ocrService.updateReceiptInDatabase(json, receiptId);
    }

    @GetMapping("/receipt")
    public ResponseEntity<String> getReceiptInfo(@RequestParam Long id) {
        // 1. Validate file
        // 2. Send to OpenAI API (see next step)
        // 3. Return extracted info
        return ocrService.getReceiptFromDatabase(id);
    }

}
