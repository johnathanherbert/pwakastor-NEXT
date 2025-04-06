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

        // Log para verificar os dados lidos
        console.log("Dados lidos do Excel:", jsonData);

        // Pass both the data and the file object
        onFileUpload(jsonData, file);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Clique para selecionar</span> ou arraste e solte</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Excel (XLS, XLSX)</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default FileUploader;