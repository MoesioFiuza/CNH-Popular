import React, { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import axios from 'axios';
import debounce from 'lodash.debounce';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination
} from '@mui/material';
import { FixedSizeList as List } from 'react-window';

type SheetData = {
  [key: string]: string;
};

interface SheetProps {
  url: string;
  title: string;
}

const SheetViewer: React.FC<SheetProps> = ({ url, title }) => {
  const [data, setData] = useState<SheetData[]>([]);
  const [editedData, setEditedData] = useState<SheetData[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(url);
        Papa.parse(response.data, {
          header: true,
          complete: (result) => {
            setData(result.data as SheetData[]);
            setEditedData(result.data as SheetData[]);
          },
        });
      } catch (error) {
        console.error('Error loading sheet:', error);
      }
    };
    fetchData();
  }, [url]);

  const handleCellChangeDebounced = useCallback(
    debounce((rowIndex: number, columnKey: string, value: string) => {
      setEditedData((prevData) => {
        const updatedData = [...prevData];
        updatedData[rowIndex][columnKey] = value;
        return updatedData;
      });
    }, 300),
    []
  );

  const handleCellChange = (rowIndex: number, columnKey: string, value: string) => {
    handleCellChangeDebounced(rowIndex, columnKey, value);
  };

  const handleSave = () => {
    console.log('Salvar dados:', editedData);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = editedData[index];
    return (
      <TableRow style={style} key={index}>
        {Object.keys(row).map((columnKey) => (
          <TableCell key={columnKey}>
            <TextField
              value={row[columnKey]}
              onChange={(e) => handleCellChange(index, columnKey, e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </TableCell>
        ))}
      </TableRow>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{title}</h2>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {data.length > 0 && Object.keys(data[0]).map((key) => (
                <TableCell key={key} style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  {key}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <List
              height={400} // altura da área visível
              itemCount={editedData.length}
              itemSize={50} // altura de cada linha
              width="100%"
            >
              {Row}
            </List>
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={editedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Button variant="contained" color="primary" onClick={handleSave} style={{ marginTop: '10px' }}>
        Salvar Alterações
      </Button>
    </div>
  );
};

export default SheetViewer;
