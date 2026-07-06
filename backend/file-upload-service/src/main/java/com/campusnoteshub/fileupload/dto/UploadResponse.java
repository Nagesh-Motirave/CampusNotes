package com.campusnoteshub.fileupload.dto;

public class UploadResponse {
    private String fileUrl;
    private String publicId;
    private String fileType;

    public UploadResponse(String fileUrl, String publicId, String fileType) {
        this.fileUrl = fileUrl;
        this.publicId = publicId;
        this.fileType = fileType;
    }

    public String getFileUrl() { return fileUrl; }
    public String getPublicId() { return publicId; }
    public String getFileType() { return fileType; }
}
