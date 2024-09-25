const input1 = document.getElementById('scannerInput1');
const input2 = document.getElementById('scannerInput2');
const resultDisplay = document.getElementById('resultDisplay');
const logTable = document.getElementById('logTable').getElementsByTagName('tbody')[0];
const recordCountDisplay = document.getElementById('recordCount');
const totalInspectionsDisplay = document.getElementById('totalInspections');
const totalOKDisplay = document.getElementById('totalOK');
const totalNGDisplay = document.getElementById('totalNG');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');

let totalInspections = 0;
let totalOK = 0;
let totalNG = 0;
let db;

// IndexedDB - Configuração
function initIndexedDB() {
  const request = indexedDB.open('QRCodeDB', 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('logs', { autoIncrement: true });
    objectStore.createIndex('date', 'date', { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
  };

  request.onerror = function (event) {
    console.error('Erro ao abrir o IndexedDB', event);
  };
}

initIndexedDB();

// Função para comparar os QR Codes
function compareQRCodes() {
  const qrCode1 = input1.value.trim();
  const qrCode2 = input2.value.trim();

  if (qrCode1 && qrCode2) {
    const result = qrCode1 === qrCode2 ? 'OK' : 'NG';
    displayResult(result);
    registerLog(qrCode1, qrCode2, result);
    updateStats(result);

    // Limpar os campos de entrada e focar no primeiro campo
    input1.value = '';
    input2.value = '';
    input1.focus();
  } else {
    resultDisplay.textContent = 'Leituras incompletas.';
    resultDisplay.style.backgroundColor = '';
    resultDisplay.style.color = 'black';
  }
}

// Função para exibir o resultado visualmente
function displayResult(result) {
  if (result === 'OK') {
    resultDisplay.textContent = 'OK';
    resultDisplay.style.backgroundColor = 'green';
    resultDisplay.style.color = 'white';
  } else {
    resultDisplay.textContent = 'NG';
    resultDisplay.style.backgroundColor = 'red';
    resultDisplay.style.color = 'white';
  }
}

// Função para registrar as leituras na tabela
function registerLog(qr1, qr2, result) {
  const newRow = logTable.insertRow();
  const date = new Date().toLocaleString();
  const cell1 = newRow.insertCell(0);
  const cell2 = newRow.insertCell(1);
  const cell3 = newRow.insertCell(2);
  const cell4 = newRow.insertCell(3);

  cell1.textContent = date;
  cell2.textContent = qr1;
  cell3.textContent = qr2;
  cell4.textContent = result;

  // Atualizar contagem de registros
  recordCountDisplay.textContent = logTable.rows.length;
}

// Função para atualizar as estatísticas
function updateStats(result) {
  totalInspections++;
  totalInspectionsDisplay.textContent = totalInspections;

  if (result === 'OK') {
    totalOK++;
    totalOKDisplay.textContent = totalOK;
  } else {
    totalNG++;
    totalNGDisplay.textContent = totalNG;
  }
}

// Adicionar evento de comparação ao botão
document.getElementById('compareBtn').addEventListener('click', compareQRCodes);

// Adicionar evento de teclado para iniciar comparação ao pressionar "Enter" em qualquer input
input1.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    input2.focus(); // Foca no próximo input
  }
});

input2.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    compareQRCodes(); // Compara os códigos ao pressionar Enter no segundo input
  }
});

// Função para salvar os registros no IndexedDB
function saveLogsToIndexedDB() {
  const rows = logTable.rows;
  const transaction = db.transaction(['logs'], 'readwrite');
  const objectStore = transaction.objectStore('logs');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const logEntry = {
      date: row.cells[0].textContent,
      qr1: row.cells[1].textContent,
      qr2: row.cells[2].textContent,
      result: row.cells[3].textContent
    };
    objectStore.add(logEntry);
  }

  transaction.oncomplete = function () {
    alert('Registros salvos no IndexedDB com sucesso.');
  };

  transaction.onerror = function (event) {
    console.error('Erro ao salvar registros no IndexedDB', event);
  };
}

saveBtn.addEventListener('click', saveLogsToIndexedDB);

// Função para exportar os dados para Excel
function exportTableToExcel() {
  const table = document.getElementById('logTable');
  const wb = XLSX.utils.table_to_book(table, { sheet: "Leituras" });
  XLSX.writeFile(wb, 'leituras_qr_codes.xlsx');
}

// Função para limpar registros
function clearLogs() {
  logTable.innerHTML = '';
  recordCountDisplay.textContent = 0;
  totalInspections = 0;
  totalOK = 0;
  totalNG = 0;
  totalInspectionsDisplay.textContent = 0;
  totalOKDisplay.textContent = 0;
  totalNGDisplay.textContent = 0;

  //Limpar registros do IndexedDB
  const transaction = db.transaction(['logs'],'readwrite');
  const objectStore = transaction.objectStore('logs');
  const clearRequest = objectStore.clear();

  clearRequest.onsuccess = function(event){
    alert('Registros do IndexeDB limpos com sucesso.');
  },

  clearRequest.onerror = function(event){
    console.error('Erro ao limpar o IndexedDB',event);
  };
}

clearBtn.addEventListener('click', clearLogs);

// Adicionar evento ao botão de exportação
document.getElementById('exportBtn').addEventListener('click', exportTableToExcel);

// Incluir a biblioteca XLSX para exportação para Excel
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
document.head.appendChild(script);

const restoreBtn = document.getElementById('restoreBtn');

// Função para restaurar registros do IndexedDB e exibir na tabela
function restoreLogsFromIndexedDB() {
  const transaction = db.transaction(['logs'], 'readonly');
  const objectStore = transaction.objectStore('logs');

  const request = objectStore.getAll();
  request.onsuccess = function (event) {
    const logs = event.target.result;
    logs.forEach(log => {
      const newRow = logTable.insertRow();
      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);

      cell1.textContent = log.date;
      cell2.textContent = log.qr1;
      cell3.textContent = log.qr2;
      cell4.textContent = log.result;
    });

    // Atualizar contagem de registros e estatísticas
    recordCountDisplay.textContent = logTable.rows.length;
    totalInspections += logs.length;
    totalInspectionsDisplay.textContent = totalInspections;

    // Recalcular OK e NG
    const okCount = logs.filter(log => log.result === 'OK').length;
    const ngCount = logs.filter(log => log.result === 'NG').length;

    totalOK += okCount;
    totalNG += ngCount;

    totalOKDisplay.textContent = totalOK;
    totalNGDisplay.textContent = totalNG;
  };

  request.onerror = function (event) {
    console.error('Erro ao restaurar registros do IndexedDB', event);
  };
}

restoreBtn.addEventListener('click', restoreLogsFromIndexedDB);