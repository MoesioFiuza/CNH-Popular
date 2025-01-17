import React, { useState, useEffect } from "react";
import "./Contratacao.css";

interface ContratacaoData {
  contrato: string;
  suite: string;
  municipio: string;
  categoria: string;
  status: Record<string, boolean>;
}

const statusList = [
  "PROCESSO ABERTO (DIHAB)",
  "AUTORIZADO (SUPER)",
  "INFOS ORÇAMENTÁRIAS (NEXEC)",
  "DECLARAÇÃO DE ORDENADOR REALIZADA (DIAF)",
  "CONTRATO ELABORADO (NUCON)",
  "CERTIDÃO LICITAWEB (LICIT)",
  "MAPA DE PREÇOS LICITAWEB ASSINADO (DIAF)",
  "CONTRATO ENVIADO À EMPRESA",
  "CONTRATO ASSINADO DEVOLVIDO AO DETRAN",
  "PARECER JURÍDICO ELABORADO (NUCON)",
  "PARECER ASSINADO (ADV NUCON)",
  "PARECER ASSINADO (DIJUR)",
  "CONTRATO ASSINADO (SUPER)",
  "CADASTRADO NO SISTEMA SACC",
  "EDOWEB OK",
  "OFÍCIO OK",
  "EDOWEB ASSINADO (DIJUR)",
  "OFÍCIO ASSINADO (SUPER)",
  "ENVIADO À CASA CIVIL",
  "CONTRATO PUBLICADO",
  "CLÍNICA COM CRÉDITO A UTILIZAR",
];

const Contratacao: React.FC = () => {
  const [contratacaoData, setContratacaoData] = useState<ContratacaoData[]>([]);
  const [filteredData, setFilteredData] = useState<ContratacaoData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [municipioFilter, setMunicipioFilter] = useState<string>("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("");
  const [municipioOptions, setMunicipioOptions] = useState<string[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<string[]>([]);
  const [filteredCategoriaOptions, setFilteredCategoriaOptions] = useState<
    string[]
  >([]);

  const fetchContratacaoData = async () => {
    try {
      setIsLoading(true);

      const responseBase = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Base de Dados"
      );
      const baseData: { valores: any[] } = await responseBase.json();

      const statusByContrato = await fetchContratacaoStatus();

      const fetchedData = baseData.valores.map((row: any): ContratacaoData => {
        const contrato = row[6] as string;
        const statusData = statusByContrato[contrato] || {};

        return {
          contrato,
          suite: row[8] as string,
          municipio: row[1] as string,
          categoria: row[0] as string,
          status: statusData,
        };
      });

      const municipios = Array.from(
        new Set(fetchedData.map((item) => item.municipio))
      ) as string[];
      const categorias = Array.from(
        new Set(fetchedData.map((item) => item.categoria))
      ) as string[];

      setMunicipioOptions(municipios);
      setCategoriaOptions(categorias);
      setContratacaoData(fetchedData);
      setFilteredData(fetchedData);
    } catch (error) {
      console.error("Erro ao carregar os dados de Contratação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContratacaoStatus = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Contratação"
      );
      const contratacaoData = await response.json();

      const statusByContrato: Record<string, Record<string, boolean>> = {};

      contratacaoData.valores.forEach((row: any) => {
        const contrato = row[0];
        const statusData = statusList.reduce((acc, status, index) => {
          const statusValue = (row[4 + index] || "").trim();
          acc[status] = statusValue === "Sim";
          return acc;
        }, {} as Record<string, boolean>);

        statusByContrato[contrato] = statusData;
      });

      return statusByContrato;
    } catch (error) {
      console.error("Erro ao carregar os dados da aba Contratação:", error);
      return {};
    }
  };

  const handleCheckboxChange = (
    rowIndex: number,
    status: string,
    checked: boolean
  ) => {
    setContratacaoData((prev) => {
      const newData = [...prev];
      const updatedStatus = { ...newData[rowIndex].status };

      if (checked) {
        statusList.forEach((statusItem, index) => {
          if (
            statusItem === status ||
            statusList.indexOf(statusItem) < statusList.indexOf(status)
          ) {
            updatedStatus[statusItem] = true;
          }
        });
      } else {
        updatedStatus[status] = false;
      }

      newData[rowIndex].status = updatedStatus;
      return newData;
    });
  };

  const applyFilters = () => {
    const filtered = contratacaoData.filter((row) => {
      const matchesMunicipio =
        !municipioFilter || row.municipio === municipioFilter;
      const matchesCategoria =
        !categoriaFilter || row.categoria === categoriaFilter;
      return matchesMunicipio && matchesCategoria;
    });
    setFilteredData(filtered);
  };

  const filterMunicipioOptions = (categoria: string) => {
    if (!categoria) {
      setMunicipioOptions(
        Array.from(new Set(contratacaoData.map((item) => item.municipio)))
      );
    } else {
      const municipiosForCategoria = contratacaoData
        .filter((row) => row.categoria === categoria)
        .map((row) => row.municipio);

      const uniqueMunicipios = Array.from(new Set(municipiosForCategoria));
      setMunicipioOptions(uniqueMunicipios);
    }
  };

  const filterCategoriaOptions = (municipio: string) => {
    if (!municipio) {
      setFilteredCategoriaOptions(categoriaOptions);
    } else {
      const categoriasForMunicipio = contratacaoData
        .filter((row) => row.municipio === municipio)
        .map((row) => row.categoria);

      const uniqueCategorias = Array.from(new Set(categoriasForMunicipio));
      setFilteredCategoriaOptions(uniqueCategorias);
    }
  };

  useEffect(() => {
    fetchContratacaoData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [municipioFilter, categoriaFilter]);

  useEffect(() => {
    filterMunicipioOptions(categoriaFilter);
    filterCategoriaOptions(municipioFilter);
  }, [categoriaFilter, municipioFilter]);

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      const valores = contratacaoData.map((row) => [
        row.contrato,
        row.suite,
        row.municipio,
        row.categoria,
        ...statusList.map((status) => (row.status[status] ? "Sim" : "Não")),
      ]);

      const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aba: "Contratação!A1:Z10000",
          valores,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar os dados na planilha.");
      }

      const result = await response.json();
      console.log("Dados salvos com sucesso:", result);
      alert("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados na planilha.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contratacao-container">
      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <div className="contratacao-filters">
            <label>
              Município:
              <select
                value={municipioFilter}
                onChange={(e) => setMunicipioFilter(e.target.value)}
                className="filter-dropdown"
              >
                <option value="">Todos</option>
                {municipioOptions.map((municipio, index) => (
                  <option key={index} value={municipio}>
                    {municipio}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Categoria:
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="filter-dropdown"
              >
                <option value="">Todas</option>
                {filteredCategoriaOptions.map((categoria, index) => (
                  <option key={index} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="contratacao-table">
            {filteredData.map((row, rowIndex) => (
              <div key={rowIndex} className="contratacao-row">
                <div className="labels-col">
                  <h3>Contrato: {row.contrato}</h3>
                  <h3>Suite: {row.suite}</h3>
                </div>
                <div className="status-checkboxes">
                  {statusList.map((status, statusIndex) => (
                    <label key={statusIndex}>
                      <input
                        type="checkbox"
                        checked={row.status[status]}
                        onChange={(e) =>
                          handleCheckboxChange(
                            rowIndex,
                            status,
                            e.target.checked
                          )
                        }
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="btn-container">
        <button className="btn salvar" onClick={handleSaveChanges}>
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default Contratacao;