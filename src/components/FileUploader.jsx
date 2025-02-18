import React from 'react';
import * as XLSX from 'xlsx';

const FileUploader = ({ onFileUpload }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        onFileUpload(jsonData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
  );
};

export default FileUploader;