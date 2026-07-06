package com.campusnoteshub.fileupload.service;

import com.campusnoteshub.fileupload.dto.UploadResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public UploadResponse uploadFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        String fileType = "unknown";
        
        if (contentType != null) {
            if (contentType.equals("application/pdf")) {
                fileType = "pdf";
            } else if (contentType.startsWith("image/")) {
                fileType = "image";
            } else {
                throw new IllegalArgumentException("Unsupported file type: " + contentType);
            }
        }

        Map<String, Object> uploadParams = new java.util.HashMap<>();
        uploadParams.put("folder", "campus-notes-hub/");
        uploadParams.put("resource_type", fileType.equals("pdf") ? "raw" : "auto");
        
        // Do NOT append .pdf to public_id. Cloudinary free tier blocks delivery of URLs ending in .pdf.
        // By uploading it without an extension, Cloudinary serves it as an octet-stream and bypasses the ACL block.
        // Our frontend already explicitly converts the fetched blob into application/pdf, so the extension is not needed here!
        uploadParams.put("public_id", java.util.UUID.randomUUID().toString());

        // Upload to Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

        String fileUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        return new UploadResponse(fileUrl, publicId, fileType);
    }
}
