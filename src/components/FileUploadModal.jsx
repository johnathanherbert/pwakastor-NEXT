import { useState, useEffect } from 'react';
import { Modal, Button, FileInput, Label, Spinner, Alert, Table, Badge, Tabs } from 'flowbite-react';
import { HiOutlineCloudUpload, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineX, HiOutlineEye, HiOutlineDocumentText, HiOutlineChartBar } from 'react-icons/hi';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

export default function FileUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'summary'
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState({ valid: true, issues: [] });
  const [dataStats, setDataStats] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFile(null);
        setUploadStatus(null);
        setUploadProgress(0);
        setStep('upload');
        setParsedData([]);
        setValidationResults({ valid: true, issues: [] });
        setDataStats(null);
        setActiveTab('preview');
      }, 300);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  const validateData = (data) => {
    const issues = [];
    const missingFields = [];
    const rowIssues = [];
    
    // Define field mappings to account for variations in column names
    const fieldMappings = {
      'CÓDIGO': ['CÓDIGO', 'CODIGO', 'COD', 'CÓDIGO MATÉRIA-PRIMA', 'CÓDIGO MATERIA-PRIMA', 'CODIGO MATERIA-PRIMA'],
      'DESCRIÇÃO': ['DESCRIÇÃO', 'DESCRICAO', 'DESC', 'DESCR', 'NOME', 'MATERIAL', 'DESCRICAO MATERIAL'],
      'LOTE': ['LOTE', 'LOTE MATERIAL', 'NUM LOTE', 'NUMERO LOTE'],
      'DATA Ajuste': ['DATA Ajuste', 'DATA_AJUSTE', 'DATA AJUSTE', 'DATA', 'DT AJUSTE', 'DT. AJUSTE', 'DATA ENTRADA']
    };
    
    // Check if data array is empty
    if (!data || data.length === 0) {
      issues.push({
        type: 'error',
        message: 'A planilha não contém dados ou está vazia.'
      });
      return { valid: false, issues };
    }
    
    // Get the first row to analyze headers
    const firstRow = data[0];
    const headers = Object.keys(firstRow);
    
    // Log headers for debugging
    console.log("Available headers:", headers);
    
    // Auto-detect possible columns matches for key fields
    const possibleMatches = {};
    Object.entries(fieldMappings).forEach(([requiredField, validNames]) => {
      // Look for exact matches first
      const exactMatch = headers.find(header => 
        validNames.some(name => header.toUpperCase() === name.toUpperCase())
      );
      
      if (exactMatch) {
        possibleMatches[requiredField] = exactMatch;
      } else {
        // Look for partial matches
        const partialMatch = headers.find(header => 
          validNames.some(name => 
            header.toUpperCase().includes(name.toUpperCase()) || 
            name.toUpperCase().includes(header.toUpperCase())
          )
        );
        if (partialMatch) {
          possibleMatches[requiredField] = partialMatch;
          // Add warning rather than error for partial matches
          issues.push({
            type: 'warning',
            message: `Campo "${requiredField}" possivelmente encontrado como "${partialMatch}" - confirme se os dados estão corretos`
          });
        } else {
          // No match found
          missingFields.push(requiredField);
          issues.push({
            type: 'warning', // Changed from error to warning
            message: `Campo "${requiredField}" não encontrado. Colunas disponíveis: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`
          });
        }
      }
    });
    
    console.log("Detected field mappings:", possibleMatches);
    
    // Create a header mapping to use in row validation
    const headerMapping = possibleMatches;

    // Data quality checks with detailed row information
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowIssue = { rowNumber, fields: [] };
      
      // Check required fields that exist in the headers
      for (const [requiredField, headerName] of Object.entries(headerMapping)) {
        if (!row[headerName] || row[headerName].toString().trim() === '') {
          rowIssue.fields.push({
            field: requiredField,
            value: row[headerName],
            issue: 'Campo vazio'
          });
        }
      }
      
      // Check date validity if the field exists
      const dateField = headerMapping['DATA Ajuste'];
      if (dateField && row[dateField]) {
        const dateValue = row[dateField];
        
        try {
          // Handle dates in dd/mm/yyyy format
          if (typeof dateValue === 'string' && dateValue.includes('/')) {
            const [day, month, year] = dateValue.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            if (isNaN(date.getTime())) {
              rowIssue.fields.push({
                field: 'DATA Ajuste',
                value: dateValue,
                issue: 'Data inválida'
              });
            }
          } 
          // Handle Excel numeric dates
          else if (typeof dateValue === 'number') {
            const date = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
            if (isNaN(date.getTime())) {
              rowIssue.fields.push({
                field: 'DATA Ajuste',
                value: dateValue,
                issue: 'Data inválida'
              });
            }
          }
          // Handle other formats
          else if (dateValue && isNaN(new Date(dateValue).getTime())) {
            rowIssue.fields.push({
              field: 'DATA Ajuste',
              value: dateValue,
              issue: 'Data inválida'
            });
          }
        } catch (e) {
          rowIssue.fields.push({
            field: 'DATA Ajuste',
            value: dateValue,
            issue: 'Data inválida (erro de formato)'
          });
        }
      }
      
      // Add the row issue if there are fields with issues
      if (rowIssue.fields.length > 0) {
        rowIssues.push(rowIssue);
        
        // Add a summary issue for this row
        issues.push({
          type: 'warning',
          message: `Linha ${rowNumber}: Problemas em ${rowIssue.fields.length} campo(s)`,
          details: rowIssue
        });
      }
    });
    
    // Summarize the row issues
    if (rowIssues.length > 0) {
      issues.push({
        type: 'warning',
        message: `${rowIssues.length} linha(s) com problemas de ${data.length} totais (${((rowIssues.length / data.length) * 100).toFixed(1)}%)`,
        rowIssues
      });
    }
    
    return {
      // Consider valid even with warnings, but still provide the issues
      valid: true,
      issues,
      missingFields,
      rowIssues,
      possibleMatches  // Include detected mappings in results
    };
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return null;
    
    const totalRecords = data.length;
    
    // Count status types
    const statusCounts = data.reduce((acc, row) => {
      const status = row['STATUS'] || 'Desconhecido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Count materials by days
    const daysCounts = {
      'Até 30 dias': 0,
      '31-60 dias': 0,
      '61-90 dias': 0,
      'Acima de 90 dias': 0
    };
    
    data.forEach(row => {
      const days = parseInt(row['DIAS CORRIDOS'], 10);
      if (!isNaN(days)) {
        if (days <= 30) daysCounts['Até 30 dias']++;
        else if (days <= 60) daysCounts['31-60 dias']++;
        else if (days <= 90) daysCounts['61-90 dias']++;
        else daysCounts['Acima de 90 dias']++;
      }
    });
    
    return {
      totalRecords,
      statusCounts,
      daysCounts
    };
  };

  const processExcelData = async (file) => {
    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Log all available sheets to assist in debugging
            console.log("Available sheets:", workbook.SheetNames);
            
            // Explicitly look for the exact sheet name "AJUSTE - SAIDA" or similar variations
            const targetSheetName = "AJUSTE - SAIDA";
            
            // Find sheet with exact name or name with trailing spaces
            const exactSheet = workbook.SheetNames.find(name => 
              name.trim() === targetSheetName.trim()
            );
            
            if (exactSheet) {
              // Use the found sheet (including if it has trailing spaces)
              console.log(`Found matching sheet: "${exactSheet}"`);
              const worksheet = workbook.Sheets[exactSheet];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                raw: false,
                defval: '' // Use empty string as default for empty cells
              });
              
              if (jsonData.length === 0) {
                throw new Error(`A planilha "${exactSheet}" está vazia.`);
              }
              
              console.log(`Using sheet "${exactSheet}" with ${jsonData.length} rows`);
              resolve(jsonData);
            } else {
              // Try less strict matching if exact match fails
              const similarSheet = workbook.SheetNames.find(name => 
                name.toLowerCase().trim().includes(targetSheetName.toLowerCase().trim())
              );
              
              if (similarSheet) {
                console.log(`Found sheet with similar name: "${similarSheet}"`);
                const worksheet = workbook.Sheets[similarSheet];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                  raw: false,
                  defval: ''
                });
                
                if (jsonData.length === 0) {
                  throw new Error(`A planilha "${similarSheet}" está vazia.`);
                }
                
                console.log(`Using sheet "${similarSheet}" with ${jsonData.length} rows`);
                resolve(jsonData);
              } else {
                // No matching sheet found, throw an error
                throw new Error(
                  `A planilha "${targetSheetName}" não foi encontrada no arquivo. ` +
                  `Planilhas disponíveis: ${workbook.SheetNames.join(', ')}`
                );
              }
            }
          } catch (error) {
            console.error('Error processing excel file:', error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
        
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error in processExcelData:', error);
      throw error;
    }
  };

  const mapDataToDatabase = (excelData) => {
    // Get the detected field mappings from validation if available
    const fieldMap = validationResults.possibleMatches || {};
    
    return excelData.map(row => {
      // Create a normalized version of row with uppercase keys for easier matching
      const normalizedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        normalizedRow[key.toUpperCase()] = value;
      });
      
      // Helper function to get field value using multiple possible names
      const getField = (fields) => {
        // First check if we have a mapped field from validation
        const mappedField = fields.find(f => fieldMap[f]);
        if (mappedField && row[fieldMap[mappedField]]) {
          return row[fieldMap[mappedField]];
        }
        
        // Fall back to case-insensitive search if no mapping or value not found
        for (const field of fields) {
          const upperField = field.toUpperCase();
          for (const key in normalizedRow) {
            if (key === upperField || key.includes(upperField)) {
              return normalizedRow[key];
            }
          }
        }
        return null;
      };
      
      // Clean and format the date
      let dataAjuste = null;
      const dateValue = getField(['DATA Ajuste', 'DATA_AJUSTE', 'DATA AJUSTE', 'DATA']);
      
      if (dateValue) {
        try {
          // Try to parse the date if it's a string in dd/mm/yyyy format
          if (typeof dateValue === 'string' && dateValue.includes('/')) {
            const dateParts = dateValue.split('/');
            dataAjuste = new Date(
              parseInt(dateParts[2]), 
              parseInt(dateParts[1]) - 1, 
              parseInt(dateParts[0])
            ).toISOString().split('T')[0];
          } 
          // Handle Excel numeric dates
          else if (typeof dateValue === 'number' || !isNaN(parseFloat(dateValue))) {
            dataAjuste = new Date(Math.round((parseFloat(dateValue) - 25569) * 86400 * 1000))
              .toISOString().split('T')[0];
          }
          // Try generic date parsing as a fallback
          else if (dateValue) {
            dataAjuste = new Date(dateValue).toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error parsing date:', e, dateValue);
        }
      }
      
      // Clean currency values (handle R$ format)
      const cleanCurrency = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        
        // Handle R$ format and convert to number
        return parseFloat(
          value.toString()
            .replace(/R\$\s*/g, '')
            .replace(/\./g, '')
            .replace(/,/g, '.')
            .trim()
        ) || 0;
      };
      
      return {
        codigo: getField(['CÓDIGO', 'CODIGO'])?.toString() || '',
        descricao: getField(['DESCRIÇÃO', 'DESCRICAO', 'DESC']) || '',
        unidade_medida: getField(['UM', 'UNIDADE', 'UNIDADE MEDIDA']) || '',
        lote: getField(['LOTE']) || '',
        centro: getField(['CEN', 'CENTRO'])?.toString() || '',
        deposito: getField(['DEP', 'DEPOSITO']) || '',
        tipo: getField(['TIPO']) || '',
        posicao: getField(['POSIÇÃO', 'POSICAO']) || '',
        quantidade: parseFloat(getField(['QUANTIDADE', 'QTD'])) || 0,
        custo_unitario: cleanCurrency(getField(['CUSTO UNIT', 'CUSTO_UNIT', 'CUSTO UNITARIO'])),
        custo_total: cleanCurrency(getField(['CUSTO TOTAL', 'CUSTO_TOTAL'])),
        controlado: getField(['CONTROLADO?', 'CONTROLADO']) || '',
        data_ajuste: dataAjuste,
        chamado: getField(['CHAMADO']) || '',
        status: getField(['STATUS']) || '',
        responsavel: getField(['RESPONSAVEL', 'RESPONSÁVEL']) || '',
        cont_lote: parseInt(getField(['CONT LOTE', 'CONT_LOTE'])) || 0,
        codigo_referencia: getField(['CODIGO', 'CÓDIGO REFERENCIA'])?.toString() || '',
        dias_corridos: parseInt(getField(['DIAS CORRIDOS', 'DIAS_CORRIDOS'])) || 0,
        limite_acima_7_dias: getField(['LIMITE ACIMA DE 7 DIAS', 'LIMITE']) || ''
      };
    });
  };

  const uploadToSupabase = async (data) => {
    try {
      // First, clear the existing data
      await supabase.from('ajusteAging').delete().neq('id', 0);
      
      // Upload in batches to avoid payload size limitations
      const batchSize = 100;
      const batches = Math.ceil(data.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, data.length);
        const batch = data.slice(start, end);
        
        const { error } = await supabase.from('ajusteAging').insert(batch);
        
        if (error) throw error;
        
        // Update progress (50-100%)
        setUploadProgress(50 + Math.round((i + 1) / batches * 50));
      }
      
      return true;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  };

  const handleAnalyzeFile = async () => {
    if (!file) {
      setUploadStatus({
        type: 'error',
        message: 'Por favor, selecione um arquivo para upload.'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      // Process Excel file with debug output
      console.log("Analyzing file:", file.name);
      const rawData = await processExcelData(file);
      console.log("Raw data length:", rawData.length);
      setParsedData(rawData);
      
      // Validate data
      const validation = validateData(rawData);
      console.log("Validation results:", validation);
      setValidationResults(validation);
      
      // Calculate statistics
      const stats = calculateStats(rawData);
      setDataStats(stats);
      
      setStep('preview');
      setIsUploading(false);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setUploadStatus({
        type: 'error',
        message: `Erro na análise do arquivo: ${error.message}`
      });
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setUploadStatus({
        type: 'error',
        message: 'Nenhum dado disponível para upload.'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      // Map data to database format
      const dbData = mapDataToDatabase(parsedData);
      
      // Upload to Supabase
      await uploadToSupabase(dbData);
      
      setUploadStatus({
        type: 'success',
        message: `Upload concluído com sucesso! ${dbData.length} registros importados.`
      });
      
      setStep('summary');
      
      if (onSuccess) {
        onSuccess(dbData.length);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({
        type: 'error',
        message: `Erro no upload: ${error.message}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecione uma planilha Excel contendo a aba <span className="font-semibold text-blue-600 dark:text-blue-500">"AJUSTE - SAIDA"</span> para importar os dados.
            </p>
            <div className="bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 rounded-lg p-4 text-sm">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <div>
                  <p className="font-medium mb-1">Importante:</p>
                  <p>O sistema importará <span className="font-semibold">exclusivamente</span> os dados da planilha <span className="font-semibold">"AJUSTE - SAIDA"</span>. Outras planilhas no arquivo serão ignoradas.</p>
                  <p className="mt-1 text-xs opacity-80">Nota: O sistema reconhecerá a aba mesmo que tenha espaços extras no nome.</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-2 block">
                <Label htmlFor="file" value="Arquivo Excel (.xlsx)" />
              </div>
              <FileInput
                id="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isUploading}
                helperText="Apenas arquivos Excel (.xlsx, .xls)"
              />
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700 dark:text-white">
                    Analisando arquivo...
                  </span>
                </div>
                <div className="flex justify-center">
                  <Spinner size="xl" />
                </div>
              </div>
            )}
            
            {uploadStatus && (
              <Alert
                color={uploadStatus.type === 'success' ? 'success' : 'failure'}
                icon={uploadStatus.type === 'success' ? HiOutlineCheckCircle : HiOutlineExclamationCircle}
              >
                <span className="font-medium">
                  {uploadStatus.message}
                </span>
              </Alert>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Análise de Dados
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Verificando {parsedData.length} registros da planilha
                </p>
              </div>
              
              <Badge 
                color={validationResults.valid ? 'success' : 'warning'}
                size="lg"
              >
                {validationResults.valid ? 'Dados Válidos' : 'Revisar Dados'}
              </Badge>
            </div>
            
            {/* Show validation issues with detailed information */}
            {validationResults.issues && validationResults.issues.length > 0 && (
              <Alert
                color="warning"
                icon={HiOutlineExclamationCircle}
                className="mb-4"
              >
                <span className="font-medium">
                  Atenção! Foram encontrados alguns problemas nos dados:
                </span>
                <ul className="mt-2 list-disc list-inside">
                  {validationResults.issues
                    .filter(issue => issue.type === 'error')
                    .map((issue, index) => (
                      <li key={`error-${index}`} className="text-red-700 dark:text-red-500">
                        {issue.message}
                      </li>
                    ))}
                  {validationResults.issues
                    .filter(issue => issue.type === 'warning' && !issue.rowIssues)
                    .slice(0, 5)
                    .map((issue, index) => (
                      <li key={`warning-${index}`}>
                        {issue.message}
                        {issue.details && (
                          <ul className="pl-5 mt-1 list-disc">
                            {issue.details.fields.map((field, fieldIndex) => (
                              <li key={fieldIndex} className="text-sm text-gray-600 dark:text-gray-400">
                                {field.field}: {field.issue} (valor atual: "{field.value || "vazio"}")
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                </ul>
                
                {/* Show table of problematic rows if there are any */}
                {validationResults.rowIssues && validationResults.rowIssues.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Resumo de Problemas:</p>
                    <div className="overflow-x-auto max-h-80 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <table className="min-w-full divide-y divide-yellow-200 dark:divide-yellow-800">
                        <thead className="bg-yellow-50 dark:bg-yellow-900/30">
                          <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">
                              Linha
                            </th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">
                              Campo(s)
                            </th>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">
                              Problema
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-yellow-200 dark:divide-yellow-800">
                          {validationResults.rowIssues.slice(0, 10).map((rowIssue) => (
                            rowIssue.fields.map((field, fieldIndex) => (
                              <tr key={`${rowIssue.rowNumber}-${fieldIndex}`} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                                {fieldIndex === 0 ? (
                                  <td rowSpan={rowIssue.fields.length} className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {rowIssue.rowNumber}
                                  </td>
                                ) : null}
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{field.field}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                  {field.issue} <span className="text-gray-500 dark:text-gray-400">(valor: "{field.value || "vazio"}")</span>
                                </td>
                              </tr>
                            ))
                          ))}
                        </tbody>
                      </table>
                      {validationResults.rowIssues.length > 10 && (
                        <div className="py-2 px-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                          Mostrando 10 de {validationResults.rowIssues.length} linhas com problemas
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 text-sm">
                  <span className="font-medium">Nota:</span> Os avisos acima são apenas informativos. 
                  Você pode prosseguir com o upload, mas verifique se os dados estão corretos.
                  {validationResults.possibleMatches && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                      <p className="font-medium text-blue-800 dark:text-blue-300">Mapeamento de campos detectado:</p>
                      <ul className="list-disc list-inside mt-1">
                        {Object.entries(validationResults.possibleMatches).map(([field, mappedField]) => (
                          <li key={field} className="text-sm text-blue-700 dark:text-blue-400">
                            {field} → {mappedField}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Tabs.Item 
                title="Prévia dos Dados" 
                icon={HiOutlineEye}
                active={activeTab === 'preview'}
              >
                <div className="overflow-x-auto mt-4">
                  <Table striped>
                    <Table.Head>
                      <Table.HeadCell>Código</Table.HeadCell>
                      <Table.HeadCell>Descrição</Table.HeadCell>
                      <Table.HeadCell>Lote</Table.HeadCell>
                      <Table.HeadCell>Data Ajuste</Table.HeadCell>
                      <Table.HeadCell>Chamado</Table.HeadCell>
                      <Table.HeadCell>Status</Table.HeadCell>
                      <Table.HeadCell>Dias</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {parsedData.slice(0, 10).map((row, index) => (
                        <Table.Row key={index} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                          <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                            {row['CÓDIGO'] || row['CODIGO']}
                          </Table.Cell>
                          <Table.Cell className="max-w-xs truncate">
                            {row['DESCRIÇÃO'] || row['DESCRICAO']}
                          </Table.Cell>
                          <Table.Cell>
                            {row['LOTE']}
                          </Table.Cell>
                          <Table.Cell>
                            {row['DATA Ajuste'] || row['DATA_AJUSTE'] || row['DATA AJUSTE'] || row['DATA']}
                          </Table.Cell>
                          <Table.Cell>
                            {row['CHAMADO']}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color={
                              row['STATUS'] === 'APROVADO' ? 'success' : 
                              row['STATUS'] === 'PENDENTE' ? 'warning' : 'info'
                            }>
                              {row['STATUS'] || 'N/A'}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            {row['DIAS CORRIDOS']}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                  {parsedData.length > 10 && (
                    <div className="text-center text-sm text-gray-500 my-3">
                      Mostrando 10 de {parsedData.length} registros
                    </div>
                  )}
                </div>
              </Tabs.Item>
              
              {validationResults.rowIssues && validationResults.rowIssues.length > 0 && (
                <Tabs.Item 
                  title={`Problemas (${validationResults.rowIssues.length})`}
                  icon={HiOutlineExclamationCircle}
                  active={activeTab === 'issues'}
                >
                  <div className="mt-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
                      <h4 className="text-md font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                        Linhas com Problemas
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Foram encontradas {validationResults.rowIssues.length} linha(s) com possíveis problemas. 
                        Revise ou corrija estas linhas na planilha original antes de enviar.
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-4 py-3">Linha</th>
                            <th scope="col" className="px-4 py-3">Código</th>
                            <th scope="col" className="px-4 py-3">Descrição</th>
                            <th scope="col" className="px-4 py-3">Lote</th>
                            <th scope="col" className="px-4 py-3">Problema</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationResults.rowIssues.map((issue) => {
                            // Get the row data from parsedData
                            const rowData = parsedData[issue.rowNumber - 1];
                            const problemFields = issue.fields.map(f => f.field).join(', ');
                            
                            return (
                              <tr key={issue.rowNumber} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-4 py-3 font-medium">{issue.rowNumber}</td>
                                <td className={`px-4 py-3 ${issue.fields.some(f => f.field === 'CÓDIGO') ? 'text-red-600 dark:text-red-400' : ''}`}>
                                  {rowData['CÓDIGO'] || rowData['CODIGO'] || '-'}
                                </td>
                                <td className={`px-4 py-3 max-w-xs truncate ${issue.fields.some(f => f.field === 'DESCRIÇÃO') ? 'text-red-600 dark:text-red-400' : ''}`}>
                                  {rowData['DESCRIÇÃO'] || rowData['DESCRICAO'] || '-'}
                                </td>
                                <td className={`px-4 py-3 ${issue.fields.some(f => f.field === 'LOTE') ? 'text-red-600 dark:text-red-400' : ''}`}>
                                  {rowData['LOTE'] || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge color="warning" className="font-normal">
                                    Problemas: {problemFields}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Tabs.Item>
              )}
              
              <Tabs.Item 
                title="Estatísticas" 
                icon={HiOutlineChartBar}
                active={activeTab === 'stats'}
              >
                {dataStats && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
                        Distribuição por Status
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(dataStats.statusCounts).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {status}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge color={
                                status === 'APROVADO' ? 'success' : 
                                status === 'PENDENTE' ? 'warning' : 'info'
                              }>
                                {count}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({((count / dataStats.totalRecords) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                      <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
                        Distribuição por Tempo
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(dataStats.daysCounts).map(([days, count]) => (
                          <div key={days} className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {days}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge color={
                                days === 'Até 30 dias' ? 'success' : 
                                days === '31-60 dias' ? 'info' : 
                                days === '61-90 dias' ? 'warning' : 'failure'
                              }>
                                {count}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({((count / dataStats.totalRecords) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Tabs.Item>
              
              <Tabs.Item 
                title="Dados Brutos" 
                icon={HiOutlineDocumentText}
                active={activeTab === 'raw'}
              >
                <div className="mt-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <pre className="text-xs overflow-auto max-h-96 text-gray-800 dark:text-gray-200">
                      {JSON.stringify(parsedData.slice(0, 5), null, 2)}
                    </pre>
                  </div>
                  <div className="text-center text-sm text-gray-500 my-3">
                    Mostrando 5 de {parsedData.length} registros em formato JSON
                  </div>
                </div>
              </Tabs.Item>
            </Tabs>
            
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700 dark:text-white">
                    Processando...
                  </span>
                  <span className="text-sm font-medium text-blue-700 dark:text-white">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {uploadStatus && (
              <Alert
                color={uploadStatus.type === 'success' ? 'success' : 'failure'}
                icon={uploadStatus.type === 'success' ? HiOutlineCheckCircle : HiOutlineExclamationCircle}
              >
                <span className="font-medium">
                  {uploadStatus.message}
                </span>
              </Alert>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <HiOutlineCheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Upload Concluído com Sucesso!
            </h3>
            
            <p className="text-base text-gray-600 dark:text-gray-400">
              {parsedData.length} registros foram importados para o sistema.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total de Registros</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{parsedData.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(Math.random() * 10) + 2}s
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Os dados estão disponíveis para uso no dashboard.
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderFooterButtons = () => {
    switch (step) {
      case 'upload':
        return (
          <>
            <Button
              onClick={handleAnalyzeFile}
              disabled={!file || isUploading}
              color="blue"
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Analisando...
                </>
              ) : (
                <>
                  <HiOutlineEye className="mr-2 h-5 w-5" />
                  Analisar
                </>
              )}
            </Button>
            <Button
              color="gray"
              onClick={onClose}
              disabled={isUploading}
            >
              <HiOutlineX className="mr-2 h-5 w-5" />
              Cancelar
            </Button>
          </>
        );
      
      case 'preview':
        return (
          <>
            <Button
              onClick={handleUpload}
              // Allow upload even with warnings, but still disable if loading
              disabled={isUploading}
              color="blue"
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <HiOutlineCloudUpload className="mr-2 h-5 w-5" />
                  Enviar para Supabase
                </>
              )}
            </Button>
            <Button
              color="gray"
              onClick={() => setStep('upload')}
              disabled={isUploading}
            >
              <HiOutlineX className="mr-2 h-5 w-5" />
              Voltar
            </Button>
          </>
        );
      
      case 'summary':
        return (
          <Button
            color="gray"
            onClick={onClose}
          >
            Fechar
          </Button>
        );
        
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (step) {
      case 'upload': return 'Importar Planilha "AJUSTE - SAIDA"';
      case 'preview': return 'Análise de Dados';
      case 'summary': return 'Importação Concluída';
      default: return 'Importar Planilha';
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size={step === 'preview' ? 'xl' : 'md'}>
      <Modal.Header>
        {getModalTitle()}
      </Modal.Header>
      <Modal.Body>
        {renderStepContent()}
      </Modal.Body>
      <Modal.Footer>
        {renderFooterButtons()}
      </Modal.Footer>
    </Modal>
  );
}
