import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber, formatValue, parseNumber, formatTaxRate } from '../utils/formatters.js';

export function usePDFGenerator() {
    
    function generatePDF(resultados, inputs, tributosDetalhados, melhorRegime, periodo) {
        if (!resultados) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = 0;

        // Cores
        const primaryColorRGB = [76, 175, 80];
        const darkHeaderColorRGB = [46, 125, 50];

        const addHeader = (isFirstPage = false) => {
            if (isFirstPage) {
                pdf.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Relatório de Simulação Tributária', margin, 20);
                pdf.setTextColor(100);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Data: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, 26, { align: 'right' });
                yPos = 40;
            } else {
                yPos = 20;
            }
        };

        const addFooter = () => {
             const pageCount = pdf.internal.getNumberOfPages();
             for(let i=1; i <= pageCount; i++) {
                 pdf.setPage(i);
                 pdf.setFontSize(8);
                 pdf.text(`Página ${i} de ${pageCount}`, pageWidth/2, pageHeight - 10, {align: 'center'});
             }
        };

        addHeader(true);

        // 1. Resumo Anual Detalhado (Solicitado)
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        pdf.text('Resumo Anual', margin, yPos);
        yPos += 5;

        // --- Cálculos dos Totais para o Resumo ---
        let faturamentoTotal = 0;
        let totalCompras = 0;
        let totalSalarios = 0;
        let totalOutrasDespesas = 0;
        const rbt12 = parseNumber(inputs.rbt12);

        if (periodo === 'anual') {
            faturamentoTotal = parseNumber(inputs.faturamentoAnual);
            const d = inputs.despesasAnual;
            
            // Soma das Compras
            totalCompras = parseNumber(d.comprasInternas) + 
                           parseNumber(d.comprasInterestaduais) + 
                           parseNumber(d.comprasImportadas);
            
            // Salários
            totalSalarios = parseNumber(d.salarios);

            // Outras Despesas (Insumos + Energia + Depreciação + Demais)
            totalOutrasDespesas = parseNumber(d.insumoServicos) + 
                                  parseNumber(d.energiaAluguelFretes) + 
                                  parseNumber(d.depreciacao) + 
                                  parseNumber(d.demaisDespesas);
        } else {
            // Trimestral: Soma dos 4 trimestres
            faturamentoTotal = Object.values(inputs.faturamentosTrimestrais).reduce((acc, val) => acc + parseNumber(val), 0);
            
            ['t1', 't2', 't3', 't4'].forEach(trim => {
                const d = inputs.despesasTrimestrais[trim];
                totalCompras += parseNumber(d.comprasInternas) + parseNumber(d.comprasInterestaduais) + parseNumber(d.comprasImportadas);
                totalSalarios += parseNumber(d.salarios);
                totalOutrasDespesas += parseNumber(d.insumoServicos) + parseNumber(d.energiaAluguelFretes) + parseNumber(d.depreciacao) + parseNumber(d.demaisDespesas);
            });
        }

        const dadosResumo = [
            ['Faturamento Anual Projetado', `R$ ${formatNumber(faturamentoTotal)}`],
            ['Receita Bruta 12 Meses', `R$ ${formatNumber(rbt12)}`],
            ['Compras (Total)', `R$ ${formatNumber(totalCompras)}`],
            ['Total Despesas com Salários', `R$ ${formatNumber(totalSalarios)}`],
            ['Total Outras Despesas', `R$ ${formatNumber(totalOutrasDespesas)}`],
            ['Período de Cálculo', periodo === 'anual' ? 'Anual' : 'Trimestral'],
            ['Melhor Regime', melhorRegime]
        ];
        
        autoTable(pdf, {
            startY: yPos,
            body: dadosResumo,
            theme: 'grid',
            styles: { lineColor: [200, 200, 200], fontSize: 10, cellPadding: 2 },
            columnStyles: { 
                0: { fontStyle: 'bold', cellWidth: 90 }, // Coluna dos Rótulos em Negrito
                1: { halign: 'right' } 
            }
        });
        yPos = pdf.lastAutoTable.finalY + 10;

        // 2. Tabela Comparativa (Carga Tributária Total)
        autoTable(pdf, {
            startY: yPos,
            head: [['Regime', 'Valor Total', '% Carga']],
            body: [
                ['Lucro Presumido', `R$ ${formatNumber(resultados.presumido.valorImpostos)}`, `${formatNumber(resultados.presumido.cargaTributariaPercentual)}%`],
                ['Lucro Real', `R$ ${formatNumber(resultados.real.valorImpostos)}`, `${formatNumber(resultados.real.cargaTributariaPercentual)}%`],
                ['Simples Nacional', `R$ ${formatNumber(resultados.simples.valorImpostos)}`, `${formatNumber(resultados.simples.cargaTributariaPercentual)}%`]
            ],
            headStyles: { fillColor: primaryColorRGB },
            theme: 'grid',
            styles: { lineColor: [200, 200, 200] }
        });
        yPos = pdf.lastAutoTable.finalY + 10;

        // 3. Detalhamento dos Tributos
        pdf.text('Detalhamento dos Cálculos Anuais Totais:', margin, yPos);
        yPos += 5;

        const bodyData = tributosDetalhados.map(t => {
            const p = resultados.presumido.detalhes[t.key] || { valor: 0, aliquota: 0 };
            const r = resultados.real.detalhes[t.key] || { valor: 0, aliquota: 0 };
            const s = resultados.simples.detalhes[t.key] || { valor: 0, aliquota: 0 };

            const cleanVal = (val) => formatValue(val).replace('R$ ', '');
            
            return [
                t.nome,
                formatTaxRate(p), cleanVal(p),
                formatTaxRate(r), cleanVal(r),
                formatTaxRate(s), cleanVal(s)
            ];
        });

        // Helper para pegar FGTS
        const getFgts = (regime) => resultados[regime].detalhes.fgts?.valor || 0;

        // Linha Subtotal s/ FGTS
        const subtotalRow = [
            'Total s/ FGTS',
            '', `R$ ${formatNumber(resultados.presumido.valorImpostos - getFgts('presumido'))}`,
            '', `R$ ${formatNumber(resultados.real.valorImpostos - getFgts('real'))}`,
            '', `R$ ${formatNumber(resultados.simples.valorImpostos - getFgts('simples'))}`
        ];

        // Linha Total Geral
        const totalRow = [
            'TOTAL GERAL',
            '', `R$ ${formatNumber(resultados.presumido.valorImpostos)}`,
            '', `R$ ${formatNumber(resultados.real.valorImpostos)}`,
            '', `R$ ${formatNumber(resultados.simples.valorImpostos)}`
        ];

        autoTable(pdf, {
            startY: yPos,
            head: [
                [
                    { content: 'Tributo', rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
                    { content: 'Lucro Presumido', colSpan: 2, styles: { halign: 'center' } },
                    { content: 'Lucro Real', colSpan: 2, styles: { halign: 'center' } },
                    { content: 'Simples Nacional', colSpan: 2, styles: { halign: 'center' } }
                ],
                ['Alíquota', 'Valor (R$)', 'Alíquota', 'Valor (R$)', 'Alíquota', 'Valor (R$)']
            ],
            body: bodyData,
            foot: [subtotalRow, totalRow],
            headStyles: { fillColor: darkHeaderColorRGB },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
            theme: 'grid',
            styles: { 
                lineColor: [200, 200, 200],
                fontSize: 8,
                cellPadding: 2,
                halign: 'right'
            },
            columnStyles: {
                0: { halign: 'left', cellWidth: 35 }
            }
        });

        addFooter();
        const pdfBlob = pdf.output('bloburl');
        window.open(pdfBlob, '_blank');
    }

    return { generatePDF };
}