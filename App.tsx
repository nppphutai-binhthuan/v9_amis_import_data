
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  FileUp, 
  Table as TableIcon, 
  Download, 
  Settings2, 
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  FileSpreadsheet,
  X,
  Save,
  ShieldCheck,
  Zap,
  PackageSearch,
  UploadCloud,
  Database,
  RefreshCw,
  PlusCircle,
  FileText,
  ShoppingBag,
  Percent,
  Search,
  ChevronRight,
  Layers,
  Archive,
  AlertTriangle,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GroupType, ImportItem, BasicUnitMap } from './types';
import { processImportData } from './geminiService';

// --- Sub-components ---

const StatCard = ({ title, value, icon: Icon, color, subValue }: { title: string, value: string, icon: any, color: string, subValue?: string }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
    <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-current/10`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{title}</p>
      <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
      {subValue && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase">{subValue}</p>}
    </div>
  </div>
);

const GroupCard = ({ 
  type, 
  isSelected, 
  onClick, 
  description, 
  color 
}: { 
  type: GroupType, 
  isSelected: boolean, 
  onClick: () => void, 
  description: string,
  color: string
}) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-start p-6 rounded-[2rem] border-2 transition-all text-left w-full h-full group
      ${isSelected 
        ? `${color} border-current shadow-2xl scale-[1.02] bg-white` 
        : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg'}`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-3 h-3 rounded-full ${isSelected ? 'animate-pulse bg-current' : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
      <h3 className="font-black text-xl tracking-tighter">[{type}]</h3>
    </div>
    <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
    {isSelected && (
      <div className="absolute top-6 right-6 text-current animate-in zoom-in">
        <CheckCircle2 className="w-7 h-7" />
      </div>
    )}
  </button>
);

// --- Basic Unit Management Modal ---
const BasicUnitModal = ({ 
  isOpen, 
  onClose, 
  onUpdateMap, 
  currentMap 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onUpdateMap: (map: BasicUnitMap, mode: 'replace' | 'update') => void,
  currentMap: BasicUnitMap 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempData, setTempData] = useState<BasicUnitMap | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        const newMap: BasicUnitMap = {};
        
        json.forEach(row => {
          const code = String(row['Mã Hàng'] || row['Mã Sản phẩm'] || row['Ma Hang'] || row['SKU'] || '').trim();
          const unit = String(row['ĐVT cơ bản'] || row['ĐVT'] || row['Unit'] || '').trim();
          const name = String(row['Tên Hàng'] || row['Tên sản phẩm'] || row['Product Name'] || '').trim();
          const group = String(row['Nhóm Hàng'] || row['Category'] || '').trim();
          
          if (code && unit) {
            newMap[code] = { itemName: name || 'N/A', basicUnit: unit, groupName: group || 'Chưa phân nhóm' };
          }
        });

        if (Object.keys(newMap).length === 0) {
          alert("Lỗi: Không nhận diện được tiêu đề cột Mã Hàng & ĐVT.");
          setFileName(null);
        } else {
          setTempData(newMap);
        }
      } catch (err) {
        alert("Lỗi đọc tệp.");
      } finally { setIsProcessing(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredMapEntries = useMemo(() => {
    return Object.entries(currentMap).filter(([code, info]) => 
      code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      info.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (info.groupName && info.groupName.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 200); 
  }, [currentMap, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/20 text-white"><PackageSearch className="w-8 h-8" /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Master Data ĐVT & Nhóm</h2>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                Dữ liệu vĩnh viễn v9.0 Final
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X className="w-8 h-8" /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-10 space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
             <div className="bg-slate-50 border border-slate-100 rounded-3xl px-8 py-4 flex items-center gap-10 shadow-inner">
                <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cơ sở dữ liệu</p><p className="text-2xl font-black text-slate-800 tabular-nums">{Object.keys(currentMap).length.toLocaleString()}</p></div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs"><ShieldCheck className="w-5 h-5" /> ACTIVE SYNC</div>
             </div>
             <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tra cứu nhanh mã hàng hoặc nhóm sản phẩm..." 
                  className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8">
            <div className="lg:w-3/4 border border-slate-100 rounded-[2rem] overflow-hidden flex flex-col bg-white shadow-xl">
              <div className="px-8 py-5 bg-slate-50 text-[10px] font-black uppercase text-slate-400 grid grid-cols-12 gap-6 tracking-widest border-b">
                <span className="col-span-2">Mã SKU</span>
                <span className="col-span-8">Sản phẩm & Phân nhóm</span>
                <span className="col-span-2 text-right">ĐVT Master</span>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {filteredMapEntries.map(([code, info]) => (
                  <tr key={code} className="hover:bg-indigo-50/30 transition-all group grid grid-cols-12 gap-6 items-center px-8 border-b border-slate-50 last:border-0">
                    <td className="py-5 font-bold text-slate-400 col-span-2 font-mono text-[11px]">{code}</td>
                    <td className="py-5 col-span-8">
                       <div className="flex flex-col gap-1">
                          <span className="text-slate-900 font-black text-sm leading-tight">{info.itemName}</span>
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Layers className="w-3 h-3" /> {info.groupName}
                          </span>
                       </div>
                    </td>
                    <td className="py-5 text-right col-span-2">
                       <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black uppercase text-[10px] border border-indigo-100 shadow-sm">{info.basicUnit}</span>
                    </td>
                  </tr>
                ))}
              </div>
            </div>

            <div className="lg:w-1/4 flex flex-col gap-6">
               {!tempData ? (
                <label className="relative flex flex-col items-center justify-center gap-6 w-full h-full border-4 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isProcessing} />
                  {isProcessing ? <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /> : <>
                    <div className="p-6 bg-white rounded-3xl shadow-xl group-hover:scale-110 transition-transform"><UploadCloud className="w-10 h-10 text-indigo-600" /></div>
                    <div className="text-center px-6">
                      <span className="font-black text-slate-800 block text-lg mb-1">Nạp Dữ Liệu Master</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-widest">Excel: Mã | Tên | ĐVT | Nhóm</p>
                    </div>
                  </>}
                </label>
              ) : (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
                  <div>
                    <div className="flex justify-between items-start mb-10">
                      <div className="bg-indigo-600 p-3 rounded-2xl"><FileSpreadsheet className="w-6 h-6" /></div>
                      <button onClick={() => setTempData(null)} className="text-white/30 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-[0.2em]">Kiểm duyệt Master Data</p>
                    <p className="font-bold truncate text-sm mb-10">{fileName}</p>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                       <p className="text-[10px] font-black mb-1 opacity-40 uppercase">Dòng hợp lệ</p>
                       <p className="text-3xl font-black">{Object.keys(tempData).length.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <button onClick={() => { onUpdateMap(tempData, 'replace'); setTempData(null); }} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">THAY THẾ TOÀN BỘ</button>
                    <button onClick={() => { onUpdateMap(tempData, 'update'); setTempData(null); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">CẬP NHẬT THÊM</button>
                  </div>
                </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBasicUnitOpen, setIsBasicUnitOpen] = useState(false);
  const [basicUnitMap, setBasicUnitMap] = useState<BasicUnitMap>({});

  const VAT_RATE = 0.08; 
  const STORAGE_KEY = 'MISA_BASIC_UNIT_MAP_V9';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setBasicUnitMap(JSON.parse(saved)); } catch (e) {} }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) { setBasicUnitMap(JSON.parse(e.newValue)); }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateBasicUnitMap = useCallback((newEntries: BasicUnitMap, mode: 'replace' | 'update') => {
    setBasicUnitMap(prev => {
      const final = mode === 'replace' ? newEntries : { ...prev, ...newEntries };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
      return final;
    });
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedGroup) return;
    setError(null);
    setIsProcessing(true);
    const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const rawData = await processImportData(base64, mimeType, selectedGroup);
        
        const processedData = rawData.map(item => {
          const mappedInfo = basicUnitMap[item.itemCode.trim()];
          let finalUnit = item.unit;
          let finalName = item.itemName;
          
          if (mappedInfo) {
            if (item.unit.toLowerCase().includes('lẻ') && mappedInfo.basicUnit) finalUnit = mappedInfo.basicUnit;
            if (mappedInfo.itemName && mappedInfo.itemName !== 'N/A') finalName = mappedInfo.itemName;
          }
          
          // Logic bổ trợ phát hiện "Dòng lạ" thủ công phòng hờ AI sót
          const lowerName = finalName.toLowerCase();
          const isStrange = lowerName.includes('ontop') || lowerName.includes('vipshop') || lowerName.includes('trả thưởng') || lowerName.includes('tra thuong');
          
          return { 
            ...item, 
            unit: finalUnit, 
            itemName: finalName,
            hasWarning: item.hasWarning || isStrange,
            warningMessage: item.warningMessage || (isStrange ? "Phát hiện từ khóa dữ liệu lạ (On-top/Vipshop/Trả thưởng)" : "")
          };
        });
        setResults(processedData);
      } catch (err: any) { setError(err.message); }
      finally { setIsProcessing(false); }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const exportToMisaTemplate = () => {
    if (results.length === 0) return;
    const misaHeaders = [
      'Ngày đơn hàng (*)', 'Số đơn hàng (*)', 'Trạng thái', 'Ngày giao hàng', 'Tính giá thành',
      'Mã khách hàng', 'Tên khách hàng', 'Địa chỉ', 'Mã số thuế', 'Diễn giải',
      'Là đơn đặt hàng phát sinh trước khi sử dụng phần mềm', 'Mã hàng (*)', 'Tên hàng',
      'Là dòng ghi chú', 'Hàng khuyến mại', 'Mã kho', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền',
      'Tỷ lệ CK (%)', 'Tiền chiết khấu', 'thuế GTGT', '% thuế suất KHAC', 'Tiền thuế GTGT', 'Biển kiểm soát'
    ];
    const misaRows = results.map(item => {
      const upVat = Math.round(item.unitPrice / (1 + VAT_RATE));
      const amVat = Math.round(item.amount / (1 + VAT_RATE));
      const dsVat = Math.round(item.discountAmount / (1 + VAT_RATE));
      const afVat = Math.round(item.afterDiscountAmount / (1 + VAT_RATE));
      const vat = Math.round(afVat * VAT_RATE);
      return [
        '', item.orderId, 'Chưa thực hiện', '', 'Có', '', item.customerName, '', '', '', '', item.itemCode, item.itemName,
        '', '', '', item.unit, item.quantity, upVat, amVat, item.discountRate, dsVat, 8, '', vat, item.totalPayment
      ];
    });
    const fullData = [["FILE MẪU NHẬP ĐƠN HÀNG MISA V9.0 FINAL"], [], [], [], [], [], [], misaHeaders, ...misaRows];
    const ws = XLSX.utils.aoa_to_sheet(fullData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MISA_DATA");
    XLSX.writeFile(wb, `Misa_Import_Final_V9_${Date.now()}.xlsx`);
  };

  const totalAmount = useMemo(() => results.reduce((acc, curr) => acc + curr.afterDiscountAmount, 0), [results]);
  const warningCount = useMemo(() => results.filter(r => r.hasWarning).length, [results]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans selection:bg-indigo-100">
      <BasicUnitModal isOpen={isBasicUnitOpen} onClose={() => setIsBasicUnitOpen(false)} onUpdateMap={updateBasicUnitMap} currentMap={basicUnitMap} />
      
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-8 hidden lg:flex flex-col border-r border-slate-800 shrink-0">
        <div className="flex items-center gap-4 mb-14">
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-500/30"><BarChart3 className="w-8 h-8" /></div>
          <div>
            <span className="font-black text-2xl tracking-tighter uppercase block leading-none">AMIS IMPORT</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-1 block">Final v9.0 Pro</span>
          </div>
        </div>
        <nav className="space-y-4 flex-1">
          <button className="w-full flex items-center gap-4 px-6 py-4 bg-white/5 text-white/40 rounded-[1.5rem] font-black text-xs uppercase transition-all hover:bg-white/10"><LayoutDashboard className="w-5 h-5" />Dashboard</button>
          <button onClick={() => setIsBasicUnitOpen(true)} className="w-full flex items-center gap-5 px-6 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] group transition-all shadow-3xl shadow-indigo-900 border border-indigo-400/20">
            <PackageSearch className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="font-black block text-sm uppercase">Master Data V9</span>
              <span className="text-[9px] opacity-70 uppercase font-black flex items-center gap-1.5 mt-1 tracking-widest"><Archive className="w-3 h-3" /> Bền vững - Đa Tab</span>
            </div>
          </button>
        </nav>
        <div className="pt-10 border-t border-slate-800 space-y-4">
           <div className="flex items-center justify-between px-2"><span className="text-[10px] font-black text-slate-500 uppercase">Engine Status</span><span className="text-[10px] font-black text-emerald-500">OPTIMIZED</span></div>
           <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-User Ready</span>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/90 backdrop-blur-2xl border-b border-slate-200 px-10 py-6 sticky top-0 z-50 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div><h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic"><Zap className="w-8 h-8 text-indigo-600 fill-indigo-600" />HỆ THỐNG ETL FINAL V9</h1></div>
          {results.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setResults([])} className="px-6 py-3 border border-slate-200 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all">Làm mới phiên</button>
              <button onClick={exportToMisaTemplate} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] flex items-center gap-3 shadow-2xl shadow-indigo-900/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all uppercase tracking-widest"><FileText className="w-4 h-4" /> Xuất Mẫu Misa V9.0</button>
            </div>
          )}
        </header>

        <div className="p-10 max-w-[2000px] mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StatCard title="Số Đơn Trích Xuất" value={String(new Set(results.map(r => r.orderId)).size)} icon={Package} color="bg-indigo-600" />
            <StatCard title="Doanh Thu Net Trực Quan" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)} icon={FileSpreadsheet} color="bg-blue-600" />
            <StatCard title="Dòng Dữ Liệu Lạ/Cảnh Báo" value={String(warningCount)} icon={AlertTriangle} color="bg-red-500" subValue={warningCount > 0 ? "Cần kiểm tra lại On-top/Vipshop" : ""} />
          </div>

          {!results.length && (
            <div className="bg-white p-14 rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12"><Zap className="w-96 h-96" /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-12">
                  <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600 shadow-inner"><Settings2 className="w-8 h-8" /></div>
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Cấu hình ETL Engine Final:</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                  <GroupCard type={GroupType.KIDO} isSelected={selectedGroup === GroupType.KIDO} onClick={() => setSelectedGroup(GroupType.KIDO)} description="Engine v9: Xử lý mã SKU [58xx] chính xác tuyệt đối, hỗ trợ phân tách Thùng/Lẻ tự động." color="text-red-600 border-red-200" />
                  <GroupCard type={GroupType.UNICHARM} isSelected={selectedGroup === GroupType.UNICHARM} onClick={() => setSelectedGroup(GroupType.UNICHARM)} description="Engine v9: Reverse OCR Intelligence, tự động cân bằng số liệu dòng dính số lẻ." color="text-blue-600 border-blue-200" />
                  <GroupCard type={GroupType.COLGATE} isSelected={selectedGroup === GroupType.COLGATE} onClick={() => setSelectedGroup(GroupType.COLGATE)} description="Engine v9: Cam kết không bỏ sót hàng tặng giá 0, ưu tiên logic khớp cột đầu tiên." color="text-yellow-600 border-yellow-200" />
                  <GroupCard type={GroupType.KIOTVIET_NPP} isSelected={selectedGroup === GroupType.KIOTVIET_NPP} onClick={() => setSelectedGroup(GroupType.KIOTVIET_NPP)} description="Engine v9: Làm sạch mã hàng đa kênh, xóa hậu tố kỹ thuật tự động trước khi import." color="text-indigo-600 border-indigo-200" />
                </div>
                {selectedGroup && (
                  <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[4rem] p-40 bg-slate-50/50 hover:border-indigo-400 transition-all group shadow-inner">
                    <div className="bg-white p-12 rounded-[3rem] shadow-3xl mb-12 group-hover:scale-110 transition-transform duration-700 border border-slate-50">
                      {isProcessing ? <Loader2 className="w-28 h-28 text-indigo-600 animate-spin" /> : <UploadCloud className="w-28 h-28 text-indigo-600" />}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
                      <span className="px-24 py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[3rem] font-black transition-all shadow-3xl shadow-indigo-900/40 inline-block text-3xl tracking-widest uppercase active:scale-95">
                        {isProcessing ? 'AI đang bóc tách số liệu...' : 'Nạp phiếu phân tích v9'}
                      </span>
                    </label>
                    <p className="mt-12 text-slate-400 font-black uppercase text-[12px] tracking-[0.4em] flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-emerald-500" /> FINAL VERSION OPTIMIZED FOR BIG DATA</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-4 border-red-100 p-10 rounded-[3rem] flex items-center gap-8 text-red-700 font-black shadow-2xl shadow-red-200/50 animate-in shake">
              <AlertCircle className="w-12 h-12 flex-shrink-0" /> <span className="text-2xl">{error}</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-10">
              <div className="p-12 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-900/30 text-white"><TableIcon className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Dữ liệu ETL v9 Final</h2>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" /> Đã kiểm soát on-top/Vipshop & trả thưởng
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-100 text-indigo-700 px-10 py-4 rounded-[2rem] text-xs font-black border border-indigo-200 uppercase tracking-[0.3em] shadow-sm tabular-nums">
                  {selectedGroup} FINAL ENGINE ACTIVE
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left border-collapse min-w-[2000px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] border-b border-slate-100">
                      <th className="px-12 py-8">Mã SKU</th>
                      <th className="px-12 py-8">Sản phẩm & Nhóm</th>
                      <th className="px-12 py-8 text-center">Cảnh Báo V9</th>
                      <th className="px-12 py-8 text-center">ĐVT</th>
                      <th className="px-12 py-8 text-right">SL</th>
                      <th className="px-12 py-8 text-right">Giá -vat</th>
                      <th className="px-12 py-8 text-right bg-indigo-50/30 font-bold">Thành tiền -vat</th>
                      <th className="px-12 py-8 text-center">KM %</th>
                      <th className="px-12 py-8 text-right">Chiết khấu</th>
                      <th className="px-12 py-8 text-right text-blue-800 bg-blue-50/10 font-bold">Thanh toán</th>
                      <th className="px-12 py-8 text-right font-black bg-slate-50 tracking-tighter">Tổng cộng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm font-bold">
                    {results.map((item, idx) => {
                      const upVat = Math.round(item.unitPrice / (1 + VAT_RATE));
                      const afVat = Math.round(item.afterDiscountAmount / (1 + VAT_RATE));
                      const mappedData = basicUnitMap[item.itemCode.trim()];

                      return (
                        <tr key={idx} className={`hover:bg-slate-50/80 transition-all group ${item.hasWarning ? 'bg-red-50/20' : ''}`}>
                          <td className="px-12 py-8 font-mono text-xs text-slate-400 group-hover:text-slate-900 transition-colors">{item.itemCode}</td>
                          <td className="px-12 py-8">
                             <div className="flex flex-col gap-1.5">
                                <span className={`text-base font-black leading-tight ${item.hasWarning ? 'text-red-700' : 'text-slate-900 group-hover:text-indigo-600'} transition-colors`}>{item.itemName}</span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                   <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                   {mappedData?.groupName || 'Chưa phân nhóm'}
                                </div>
                             </div>
                          </td>
                          <td className="px-12 py-8 text-center">
                             {item.hasWarning ? (
                               <div className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-2xl animate-pulse">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">CẢNH BÁO LẠ</span>
                                  <div className="absolute hidden group-hover:block bottom-full mb-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-[10px] whitespace-nowrap z-[60]">
                                    {item.warningMessage}
                                  </div>
                                </div>
                             ) : (
                               <div className="flex items-center justify-center text-emerald-500 opacity-20"><ShieldCheck className="w-5 h-5" /></div>
                             )}
                          </td>
                          <td className="px-12 py-8 text-center">
                            <span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase shadow-sm border border-slate-200 group-hover:bg-white">{item.unit}</span>
                          </td>
                          <td className="px-12 py-8 text-right font-black text-slate-900 text-xl tabular-nums">{item.quantity}</td>
                          <td className="px-12 py-8 text-right text-slate-400 tabular-nums">{new Intl.NumberFormat('vi-VN').format(upVat)}</td>
                          <td className="px-12 py-8 text-right font-black text-indigo-700 bg-indigo-50/10 tabular-nums">{new Intl.NumberFormat('vi-VN').format(afVat)}</td>
                          <td className="px-12 py-8 text-center">
                             <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-black text-lg"><Percent className="w-4 h-4" /> {item.discountRate}</div>
                          </td>
                          <td className="px-12 py-8 text-right text-emerald-700 tabular-nums">{new Intl.NumberFormat('vi-VN').format(item.discountAmount)}</td>
                          <td className="px-12 py-8 text-right font-black text-blue-800 bg-blue-50/5 tabular-nums text-lg">{new Intl.NumberFormat('vi-VN').format(item.afterDiscountAmount)}</td>
                          <td className="px-12 py-8 text-right font-black bg-slate-50 text-slate-900 tabular-nums">{new Intl.NumberFormat('vi-VN').format(item.totalPayment)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-12 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-6">
                   <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-2xl shadow-emerald-500"></div>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Engine v9.0 Final Optimized - Dữ liệu đã được kiểm duyệt an toàn</span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 font-black uppercase mb-3 tracking-widest">Tổng doanh thu Net phiên hiện tại</p>
                  <p className="text-5xl font-black text-indigo-600 tracking-tighter tabular-nums">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
