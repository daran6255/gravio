"""File Storage Service for handling file uploads and downloads"""

import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
from datetime import datetime


class FileStorageService:
    """Service for managing file uploads with structured folder organization"""
    
    # Base upload directory
    BASE_UPLOAD_DIR = Path("uploads/candidates")
    
    # Allowed file types and max sizes
    ALLOWED_EXTENSIONS = {
        "resume": {".pdf", ".doc", ".docx"},
        "trainer_resume": {".pdf", ".doc", ".docx"},
        "disability_certificate": {".pdf", ".jpg", ".jpeg", ".png"},
        "10th_certificate": {".pdf", ".jpg", ".jpeg", ".png"},
        "12th_certificate": {".pdf", ".jpg", ".jpeg", ".png"},
        "degree_certificate": {".pdf", ".jpg", ".jpeg", ".png"},
        "pan_card": {".pdf", ".jpg", ".jpeg", ".png"},
        "aadhar_card": {".pdf", ".jpg", ".jpeg", ".png"},
        "passport_photo": {".jpg", ".jpeg", ".png"},
        "offer_letter": {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"},
        "other": {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".zip"}
    }
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension"""
        return Path(filename).suffix.lower()
    
    @staticmethod
    def _sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent directory traversal"""
        # Remove path components and keep only the filename
        safe_name = Path(filename).name
        # Replace spaces and special characters
        safe_name = safe_name.replace(" ", "_")
        return safe_name
    
    @staticmethod
    def _generate_unique_filename(original_filename: str) -> str:
        """Generate unique filename with timestamp and UUID"""
        ext = FileStorageService._get_file_extension(original_filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        base_name = Path(original_filename).stem[:50]  # Limit length
        safe_base = FileStorageService._sanitize_filename(base_name)
        return f"{safe_base}_{timestamp}_{unique_id}{ext}"
    
    @staticmethod
    def validate_file(file: UploadFile, document_type: str) -> None:
        """
        Validate uploaded file
        Raises HTTPException if validation fails
        """
        # Check if document type is valid
        if document_type not in FileStorageService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid document type. Must be one of: {list(FileStorageService.ALLOWED_EXTENSIONS.keys())}"
            )
        
        # Check file extension
        file_ext = FileStorageService._get_file_extension(file.filename)
        allowed_exts = FileStorageService.ALLOWED_EXTENSIONS[document_type]
        
        if file_ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type for {document_type}. Allowed: {', '.join(allowed_exts)}"
            )
        
        # Check file size (if file has size attribute)
        if hasattr(file, 'size') and file.size:
            if file.size > FileStorageService.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size: {FileStorageService.MAX_FILE_SIZE / (1024*1024)}MB"
                )
        else:
            # Fallback: Check size by seeking to end
            try:
                file.file.seek(0, 2)
                size = file.file.tell()
                file.file.seek(0)
                if size > FileStorageService.MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File too large. Maximum size: {FileStorageService.MAX_FILE_SIZE / (1024*1024)}MB"
                    )
            except Exception:
                pass # If verify fails here, we will catch it during save
    
    @staticmethod
    async def save_file(
        file: UploadFile,
        candidate_public_id: str,
        document_type: str,
        candidate_name: str = "unknown",
        candidate_id: Optional[int] = None
    ) -> dict:
        """
        Save uploaded file to structured folder:
        uploads/candidates/{name}_{id}/{document_type}/
        Returns dict with file info: {file_path, file_name, file_size, mime_type}
        """
        # Validate file
        FileStorageService.validate_file(file, document_type)
        
        # Sanitize candidate name for folder name
        safe_name = FileStorageService._sanitize_filename(candidate_name).lower()
        suffix = f"_{candidate_id}" if candidate_id else f"_{candidate_public_id[:8]}"
        candidate_folder = f"{safe_name}{suffix}"
        
        # Create folder structure: uploads/candidates/{candidate_folder}/{document_type}/
        folder_path = FileStorageService.BASE_UPLOAD_DIR / candidate_folder / document_type
        folder_path.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        unique_filename = FileStorageService._generate_unique_filename(file.filename)
        file_path = folder_path / unique_filename
        
        # Save file
        try:
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Get file size
            file_size = len(content)
            
            # Return file info
            return {
                "file_path": str(file_path),
                "file_name": unique_filename,
                "file_size": file_size,
                "mime_type": file.content_type
            }
        
        except Exception as e:
            # Clean up if something goes wrong
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete a file from storage"""
        try:
            path = Path(file_path)
            if path.exists() and path.is_file():
                path.unlink()
                
                # Try to remove empty parent directories
                try:
                    path.parent.rmdir()  # document_type folder
                    path.parent.parent.rmdir()  # public_id folder
                except OSError:
                    # Directories not empty, that's fine
                    pass
                
                return True
            return False
        except Exception:
            return False
    
    @staticmethod
    def get_file_path(file_path: str) -> Optional[Path]:
        """Get file path if it exists"""
        path = Path(file_path)
        if path.exists() and path.is_file():
            return path
        return None
