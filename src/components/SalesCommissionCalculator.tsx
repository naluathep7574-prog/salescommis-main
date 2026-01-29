"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Plus, RotateCcw, Calculator, Trash2 } from "lucide-react"
import * as XLSX from "xlsx"

// --- 1. Logic ส่วนการคำนวณ ---
interface CommissionBreakdown {
  tier1: number; tier2: number; tier3: number; total: number
}

const PRICE_LOCK = 45.0
const PRICE_STOCK = 30.0
const PRICE_BARREL = 25.0

const MAX_LOCKS = 70
const MAX_STOCKS = 80
const MAX_BARRELS = 90

const calculateSales = (locks: number, stocks: number, barrels: number): number => {
  return (locks * PRICE_LOCK) + (stocks * PRICE_STOCK) + (barrels * PRICE_BARREL)
}

const calculateCommission = (sales: number): CommissionBreakdown => {
  let remainingSales = sales
  let tier1 = 0, tier2 = 0, tier3 = 0

  if (remainingSales > 1000) { tier1 = 1000 * 0.10; remainingSales -= 1000 }
  else { tier1 = remainingSales * 0.10; remainingSales = 0 }

  if (remainingSales > 800) { tier2 = 800 * 0.15; remainingSales -= 800 }
  else { tier2 = remainingSales * 0.15; remainingSales = 0 }

  if (remainingSales > 0) { tier3 = remainingSales * 0.20 }

  return { tier1, tier2, tier3, total: tier1 + tier2 + tier3 }
}

const validateInput = (value: string, min: number, max: number) => {
  if (!value || value.trim() === "") return { isValid: false, error: "กรุณาระบุจำนวน" }
  const num = Number(value)
  if (isNaN(num)) return { isValid: false, error: "ต้องเป็นตัวเลข" }
  if (!Number.isInteger(num)) return { isValid: false, error: "ต้องเป็นจำนวนเต็ม" }
  if (num < min) return { isValid: false, error: `ขั้นต่ำคือ ${min}` }
  if (num > max) return { isValid: false, error: `สูงสุดคือ ${max}` }
  return { isValid: true, error: "" }
}

// --- 2. Main Component ---
interface InputState { value: string; error: string; isValid: boolean }
interface CalculationRecord {
  id: string; timestamp: Date; employeeId: string; employeeName: string;
  locks: number; stocks: number; barrels: number; sales: number; commission: CommissionBreakdown
}

export default function SalesCommissionCalculator() {
  const resultRef = useRef<HTMLDivElement>(null)

  const [employeeId, setEmployeeId] = useState<InputState>({ value: "", error: "", isValid: false })
  const [firstName, setFirstName] = useState<InputState>({ value: "", error: "", isValid: false })
  const [lastName, setLastName] = useState<InputState>({ value: "", error: "", isValid: false })
  
  const [locks, setLocks] = useState<InputState>({ value: "", error: "", isValid: false })
  const [stocks, setStocks] = useState<InputState>({ value: "", error: "", isValid: false })
  const [barrels, setBarrels] = useState<InputState>({ value: "", error: "", isValid: false })
  
  const [calculated, setCalculated] = useState(false)
  const [sales, setSales] = useState(0)
  const [commission, setCommission] = useState({ tier1: 0, tier2: 0, tier3: 0, total: 0 })
  const [history, setHistory] = useState<CalculationRecord[]>([])

  const formatNumber = (val: number) => new Intl.NumberFormat('th-TH', { style: 'decimal', minimumFractionDigits: 2 }).format(val)

  const handleCalculate = () => {
    const l = Number(locks.value), s = Number(stocks.value), b = Number(barrels.value)
    const totalSales = calculateSales(l, s, b)
    setSales(totalSales)
    setCommission(calculateCommission(totalSales))
    setCalculated(true)

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const handleSaveAndNew = () => {
    const newRecord: CalculationRecord = {
      id: Date.now().toString(), timestamp: new Date(), employeeId: employeeId.value,
      employeeName: `${firstName.value} ${lastName.value}`,
      locks: Number(locks.value), stocks: Number(stocks.value), barrels: Number(barrels.value),
      sales, commission
    }
    setHistory([newRecord, ...history])
    setLocks({ value: "", error: "", isValid: false })
    setStocks({ value: "", error: "", isValid: false })
    setBarrels({ value: "", error: "", isValid: false })
    setCalculated(false)
  }

  // ฟังก์ชันลบรายการ
  const handleDeleteRecord = (id: string) => {
    setHistory(history.filter(record => record.id !== id))
  }

  const handleExportExcel = () => {
    if (history.length === 0) return;
    
    const dataToExport = history.map(item => ({
        "วันที่เวลา": item.timestamp.toLocaleString('th-TH'),
        "รหัสพนักงาน": item.employeeId,
        "ชื่อ-นามสกุล": item.employeeName,
        "Locks": item.locks,
        "Stocks": item.stocks,
        "Barrels": item.barrels,
        "ยอดขายรวม": item.sales,
        "ค่าคอมมิชชั่น": item.commission.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commission Report");
    XLSX.writeFile(workbook, `Commission_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  const isFormValid = locks.isValid && stocks.isValid && barrels.isValid && employeeId.isValid && firstName.value.trim() !== "" && lastName.value.trim() !== ""

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-10">
            <Calculator className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 uppercase">ระบบคำนวณค่าคอมมิชชั่น</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. ข้อมูลพนักงาน */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">ข้อมูลพนักงาน</h2>
                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-slate-400 hover:text-purple-600">
                      <RotateCcw className="w-4 h-4 mr-1"/> รีเซ็ตทั้งหมด
                    </Button>
                </div>
                <div className="space-y-6">
                    <div className="max-w-[250px]">
                        <label className="text-sm font-bold block mb-1">รหัสพนักงาน</label>
                        <Input 
                            value={employeeId.value} 
                            onChange={(e) => setEmployeeId({value: e.target.value.toUpperCase().replace(/\s/g, ''), error: "", isValid: e.target.value.length >= 3})} 
                            className={employeeId.error ? "border-red-500" : ""} 
                            placeholder="EMP001" 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-bold block mb-1">ชื่อ</label>
                            <Input value={firstName.value} onChange={(e) => setFirstName({ ...firstName, value: e.target.value, isValid: !!e.target.value })} placeholder="ชื่อภาษาไทย/อังกฤษ" />
                        </div>
                        <div>
                            <label className="text-sm font-bold block mb-1">นามสกุล</label>
                            <Input value={lastName.value} onChange={(e) => setLastName({ ...lastName, value: e.target.value, isValid: !!e.target.value })} placeholder="นามสกุล" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. รายการสินค้า */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6">รายการสินค้า</h2>
                <div className="grid grid-cols-3 gap-6 mb-8">
                    {[
                        { label: "Locks", max: MAX_LOCKS, s: locks, setter: setLocks, color: "bg-purple-50" },
                        { label: "Stocks", max: MAX_STOCKS, s: stocks, setter: setStocks, color: "bg-indigo-50" },
                        { label: "Barrels", max: MAX_BARRELS, s: barrels, setter: setBarrels, color: "bg-fuchsia-50" }
                    ].map((item, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border border-slate-100 ${item.color}`}>
                            <label className="text-xs font-bold text-slate-600 block mb-1">{item.label}</label>
                            <Input 
                              type="number" 
                              value={item.s.value} 
                              onChange={(e) => {
                                const val = validateInput(e.target.value, 1, item.max)
                                item.setter({ value: e.target.value, error: val.error, isValid: val.isValid })
                              }} 
                              className="bg-white"
                              placeholder={`1-${item.max}`} 
                            />
                            {item.s.error && <p className="text-red-500 text-[10px] mt-1 font-medium">{item.s.error}</p>}
                        </div>
                    ))}
                </div>
                <Button onClick={handleCalculate} disabled={!isFormValid} className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-full font-bold text-white shadow-lg transition-all">คำนวณ</Button>
            </div>

            {/* 3. ส่วนผลลัพธ์ */}
            {calculated && (
                <div ref={resultRef} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm scroll-mt-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">ผลลัพธ์</h2>
                        <div className="flex gap-2">
                            <Button onClick={handleSaveAndNew} className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 font-bold">
                              <Plus className="w-4 h-4 mr-2"/> บันทึกประวัติ
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ยอดขายรวม</p>
                            <div className="flex flex-row items-baseline gap-2 leading-tight">
                                <span className="text-4xl font-black text-slate-800 tracking-tight">
                                    {formatNumber(sales)}
                                </span>
                                <span className="text-xl font-black text-slate-800">
                                    บาท
                                </span>
                            </div>
                        </div>

                        <div className="bg-purple-600 p-6 rounded-xl text-white relative shadow-lg shadow-purple-100 overflow-hidden">
                            <p className="text-xs font-bold text-purple-100 uppercase mb-1 tracking-widest">คอมมิชชั่นสุทธิ</p>
                            <div className="flex flex-row items-baseline gap-2 mb-6">
                                <span className="text-3xl font-black">{formatNumber(commission.total)}</span>
                                <span className="text-lg font-bold text-purple-200">บาท</span>
                            </div>
                            
                            <div className="pt-4 border-t border-purple-400 text-[10px] font-bold text-purple-100 flex justify-between uppercase">
                                <span>T1: {formatNumber(commission.tier1)}</span>
                                <span>T2: {formatNumber(commission.tier2)}</span>
                                <span>T3: {formatNumber(commission.tier3)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          {/* ส่วนประวัติข้างเคียง - อัปเดตใหม่ */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                ประวัติล่าสุด 
                <span className="bg-purple-100 text-purple-600 text-xs px-2.5 py-1 rounded-full">{history.length}</span>
              </h2>
              {/* เพิ่มปุ่มดาวน์โหลดที่นี่ */}
              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleExportExcel}
                  className="text-purple-600 hover:bg-purple-50 h-8 w-8 p-0"
                  title="ดาวน์โหลด Excel"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                    <p className="text-slate-400 text-sm italic">ยังไม่มีรายการบันทึก</p>
                  </div>
                )}
                {history.map(r => (
                    <div key={r.id} className="group p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-purple-200 transition-all relative">
                        {/* ปุ่มลบรายการ */}
                        <button 
                          onClick={() => handleDeleteRecord(r.id)}
                          className="absolute -top-2 -right-2 bg-white text-red-400 hover:text-red-600 p-1.5 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex justify-between font-bold text-sm">
                            <span className="truncate max-w-[100px] text-slate-700">{r.employeeName}</span>
                            <span className="text-purple-600">+{r.commission.total.toFixed(2)} ฿</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                          {r.employeeId} • ยอดขาย {r.sales.toLocaleString()} บาท
                        </p>
                        <p className="text-[8px] text-slate-300 mt-1 uppercase">
                          {r.timestamp.toLocaleTimeString('th-TH')}
                        </p>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}