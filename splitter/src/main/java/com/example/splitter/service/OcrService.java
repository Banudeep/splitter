package com.example.splitter.service;

import com.example.splitter.model.dto.BillsDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

import com.example.splitter.model.Bills;
import com.example.splitter.repo.BillsRepo;
import com.example.splitter.model.Items;
import com.example.splitter.repo.ItemsRepo;
import com.example.splitter.model.dto.BillsDTO;

import com.example.splitter.model.dto.ItemsDTO;



@Service
public class OcrService {
    @Value("${OPENAI_API_KEY:}")
    private String openaiApiKey;

    @Value("${OPENAI_API_URL:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;

    @Autowired
    private BillsRepo billsRepo;

    public ResponseEntity<String> extractTextFromImage(MultipartFile file) {
        // Dummy implementation for illustration purposes
        System.out.println("Received file: " + file.getOriginalFilename());
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        // Validate API key is set
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            System.err.println("ERROR: OPENAI_API_KEY environment variable is not set");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable. " +
                          "For Docker: Ensure it's in your .env file. " +
                          "For local development: Set it as an environment variable.");
        }

        try {
            // Prepare the request body for OpenAI API
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", "gpt-4o");

            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", "You are a strict receipt-to-JSON extractor. Read the provided image and output ONLY one JSON object that matches the exact schema below, The prices have to be accurate, check them rigourously. \n" +
                    "ABSOLUTE RULES:\n" +
                    "- Do not add, rename, or remove keys from the schema. No extra metadata, notes, or null fields.\n" +
                    "- Do not hallucinate values. Only use what is clearly printed on the receipt.\n" +
                    "- some bills have dicounts on the below line with the discount followed by '-' symbol,subtract this from the previous entries price to get the correct price\n" +
                    "- If a value is missing/unclear, use an empty string for text fields and 0 for numbers.\n" +
                    "- Prices are decimals without currency symbols. Date = YYYY-MM-DD, time = HH:MM (24h).\n" +
                    "- Items: if quantity is printed, multiply unit price × quantity to set \"price\"; if not printed, assume quantity 1.\n" +
                    "- Trim whitespace and preserve on-receipt wording for item descriptions where legible.\n" +
                    "- Return raw JSON only (no markdown, no commentary).\n" +
                    "\n" +
                    "SCHEMA:\n" +
                    "{\n" +
                    "  \"storeName\": \"string\",\n" +
                    "  \"storeAddress\": \"string\",\n" +
                    "  \"date\": \"string\",\n" +
                    "  \"time\": \"string\",\n" +
                    "  \"items\": [\n" +
                    "    { \"description\": \"string\", \"price\": \"number\" }\n" +
                    "  ],\n" +
                    "  \"subTotal\": \"number\",\n" +
                    "  \"taxTotal\": \"number\",\n" +
                    "  \"total\": \"number\"\n" +
                    "}\n");
            Map<String, Object> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            List<Map<String, Object>> content = new ArrayList<>();
            content.add(Map.of("type", "text", "text", "Extract all information from this receipt image."));
            content.add(Map.of("type", "image_url", "image_url", Map.of("url", "data:" + file.getContentType() + ";base64," + base64Image)));
            userMsg.put("content", content);

            messages.add(systemMsg);
            messages.add(userMsg);

            payload.put("messages", messages);
            payload.put("max_tokens", 1024);


            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

            RestTemplate restTemplate = new RestTemplate();
            
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(openaiApiUrl, requestEntity, String.class);

                if (response.getStatusCode() != HttpStatus.OK) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("OpenAI API error");
                }
                else {
                    JsonNode receiptJson = extractReceiptJson(response.getBody());
                    ObjectMapper mapper = new ObjectMapper();
                    String prettyJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(receiptJson);
                    return ResponseEntity.ok(prettyJson);
//                return ResponseEntity.ok(response.getBody());
                }
            } catch (HttpClientErrorException e) {
                // Handle 4xx errors (401 Unauthorized, 400 Bad Request, etc.)
                System.err.println("OpenAI API client error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    // Specific handling for 401 - API key issue
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("OpenAI API authentication failed (401). Your API key may be invalid or expired. Please check your OPENAI_API_KEY in application.properties.");
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("OpenAI API error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
                }
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to read file");
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            // Check if it's a 401 error in the message (fallback for any other exception types)
            if (errorMsg != null && errorMsg.contains("401")) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("OpenAI API authentication failed (401). Your API key may be invalid or expired. Please check your OPENAI_API_KEY in application.properties.");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("OpenAI API error: " + errorMsg);
        }
    }

    public static JsonNode extractReceiptJson(String responseJson) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(responseJson);
        String content = root.path("choices").get(0).path("message").path("content").asText();

        // Remove code block markers if present
        if (content.startsWith("```json")) {
            content = content.substring(7);
        }
        if (content.endsWith("```")) {
            content = content.substring(0, content.length() - 3);
        }
        content = content.trim();

        // Parse the inner JSON
        return mapper.readTree(content);
    }

    public ResponseEntity<Map> addReceiptToDatabase(BillsDTO json) {
        // Dummy implementation for illustration purposes
        System.out.println("Received JSON: " + json);
        // Here you would typically save the JSON to your database
        Bills bills = new Bills();

        bills.setStoreName(json.getStoreName());
        bills.setStoreAddress(json.getStoreAddress());
        bills.setDate(json.getDate());
        bills.setTime(json.getTime());
        bills.setSubTotal(json.getSubTotal());
        bills.setTaxTotal(json.getTaxTotal());
        bills.setTotal(json.getTotal());

        List<Items> itemsList = new ArrayList<>();
        for (ItemsDTO itemDTO : json.getItems()) {
            Items item = new Items();
            item.setDescription(itemDTO.getDescription());
            item.setPrice(itemDTO.getPrice());
            itemsList.add(item);
        }
        bills.setItems(itemsList);


        Bills saved = billsRepo.save(bills);
        Map<String, Object> response = new HashMap<>();
        response.put("id", saved.getReceiptId());
        return ResponseEntity.ok(response);

//        return ResponseEntity.ok("Receipt added to database. ID: " + saved.getId());
    }

    @Transactional
    public ResponseEntity<Map> updateReceiptInDatabase(BillsDTO json, Long receiptId) {
        System.out.println("Updating receipt with ID: " + receiptId);
        Optional<Bills> optionalBills = billsRepo.findByReceiptId(receiptId);
        System.out.println("Optional bills: "+optionalBills);
        if (optionalBills.isPresent()) {
            Bills bills = optionalBills.get();

            bills.setStoreName(json.getStoreName());
            bills.setStoreAddress(json.getStoreAddress());
            bills.setDate(json.getDate());
            bills.setTime(json.getTime());
            bills.setSubTotal(json.getSubTotal());
            bills.setTaxTotal(json.getTaxTotal());
            bills.setTotal(json.getTotal());

            // Ensure we mutate the existing collection to keep orphanRemoval semantics
            List<Items> existingItems = bills.getItems();
            if (existingItems == null) {
                existingItems = new ArrayList<>();
                bills.setItems(existingItems);
            } else {
                existingItems.clear();
            }

            if (json.getItems() != null) {
                for (ItemsDTO itemDTO : json.getItems()) {
                    Items item = new Items();
                    item.setDescription(itemDTO.getDescription());
                    item.setPrice(itemDTO.getPrice());
                    item.setBills(bills);
                    existingItems.add(item);
                }
            }

            Bills saved = billsRepo.save(bills);
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getReceiptId());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Receipt not found"));
        }
    }


    public ResponseEntity<String> getReceiptFromDatabase(Long id) {
        // Dummy implementation for illustration purposes
        System.out.println("Fetching receipt with ID: " + id);
        // Here you would typically fetch the JSON from your database using the provided ID
        Optional<Bills> optionalBills = billsRepo.findByReceiptId(id); // Uncomment and implement repository to fetch from DB
        if (optionalBills.isPresent()) {
            Bills bills = optionalBills.get();
            BillsDTO billsDTO = new BillsDTO();
            billsDTO.setStoreName(bills.getStoreName());
            billsDTO.setStoreAddress(bills.getStoreAddress());
            billsDTO.setDate(bills.getDate());
            billsDTO.setTime(bills.getTime());
            billsDTO.setSubTotal(bills.getSubTotal());
            billsDTO.setTaxTotal(bills.getTaxTotal());
            billsDTO.setTotal(bills.getTotal());

            List<ItemsDTO> itemsDTOList = new ArrayList<>();
            for (Items item : bills.getItems()) {
                ItemsDTO itemDTO = new ItemsDTO();
                itemDTO.setId(item.getId());
                itemDTO.setDescription(item.getDescription());
                itemDTO.setPrice(item.getPrice());
                itemsDTOList.add(itemDTO);
            }
            billsDTO.setItems(itemsDTOList);

            try {
                ObjectMapper mapper = new ObjectMapper();
                String prettyJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(billsDTO);
                return ResponseEntity.ok(prettyJson);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error converting to JSON");
            }
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Receipt not found");
        }
    }
}

