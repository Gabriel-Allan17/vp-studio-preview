const encoder=new TextEncoder();
const xml=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
const col=(n)=>{let result='';for(n++;n;n=Math.floor((n-1)/26))result=String.fromCharCode(65+(n-1)%26)+result;return result;};
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let n=0;n<8;n++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function header(size,fields){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);for(const[offset,value,width]of fields)width===2?view.setUint16(offset,value,true):view.setUint32(offset,value,true);return bytes;}
export function workbookBytes(tables){
  const files=[];const put=(name,text)=>files.push({name:encoder.encode(name),data:encoder.encode(text)});
  put('[Content_Types].xml',`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${tables.map((_,n)=>`<Override PartName="/xl/worksheets/sheet${n+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  put('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  put('xl/workbook.xml',`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${tables.map((t,n)=>`<sheet name="${xml(t.name.slice(0,31))}" sheetId="${n+1}" r:id="rId${n+1}"/>`).join('')}</sheets></workbook>`);
  put('xl/_rels/workbook.xml.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${tables.map((_,n)=>`<Relationship Id="rId${n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n+1}.xml"/>`).join('')}</Relationships>`);
  tables.forEach((table,n)=>{
    const keys=[...new Set(table.rows.flatMap(Object.keys))];if(!keys.length)keys.push('Sem registros');
    const rows=[keys,...table.rows.map(row=>keys.map(key=>row[key]??''))];
    put(`xl/worksheets/sheet${n+1}.xml`,`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${keys.length}" width="24" customWidth="1"/></cols><sheetData>${rows.map((row,r)=>`<row r="${r+1}">${row.map((value,c)=>`<c r="${col(c)}${r+1}" ${typeof value==='number'&&Number.isFinite(value)?'':'t="inlineStr"'}>${typeof value==='number'&&Number.isFinite(value)?`<v>${value}</v>`:`<is><t xml:space="preserve">${xml(value)}</t></is>`}</c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${col(keys.length-1)}${rows.length}"/></worksheet>`);
  });
  const chunks=[],central=[];let offset=0;
  files.forEach(file=>{const crc=crc32(file.data),size=file.data.length,nameLength=file.name.length;
    chunks.push(header(30,[[0,0x04034b50,4],[4,20,2],[14,crc,4],[18,size,4],[22,size,4],[26,nameLength,2]]),file.name,file.data);
    central.push(header(46,[[0,0x02014b50,4],[4,20,2],[6,20,2],[16,crc,4],[20,size,4],[24,size,4],[28,nameLength,2],[42,offset,4]]),file.name);offset+=30+nameLength+size;
  });
  const centralSize=central.reduce((n,c)=>n+c.length,0);chunks.push(...central,header(22,[[0,0x06054b50,4],[8,files.length,2],[10,files.length,2],[12,centralSize,4],[16,offset,4]]));
  const bytes=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let position=0;chunks.forEach(chunk=>{bytes.set(chunk,position);position+=chunk.length;});return bytes;
}
export function exportWorkbook(tables,name){const blob=new Blob([workbookBytes(tables)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
