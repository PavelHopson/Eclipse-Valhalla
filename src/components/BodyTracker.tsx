/**
 * Eclipse Valhalla — Body & Nutrition Tracker
 * Weight tracking, body measurements, KBJU calculator
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { generateId } from '../utils';
import { Plus, X, TrendingDown, TrendingUp, Scale, Ruler, Calculator, Flame } from 'lucide-react';

interface WeightEntry { id: string; date: string; weight: number; }
interface MeasurementEntry { id: string; date: string; chest?: number; waist?: number; hips?: number; arms?: number; }

const STORAGE_WEIGHT = 'eclipse_weight_log';
const STORAGE_MEASURE = 'eclipse_measurements';
const STORAGE_KBJU = 'eclipse_kbju_profile';

const V = { bg0:'#0A0A0F', bg2:'#12121A', bg3:'#1A1A26', text:'#E8E8F0', textSec:'#8888A0', textTer:'#55556A', textDis:'#3A3A4A', border:'#1E1E2E', borderL:'#2A2A3C', accent:'#5DAEFF', orange:'#FF6B35', gold:'#D8C18E', success:'#4ADE80', danger:'#FF4444' };

function loadArr<T>(key: string): T[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveArr<T>(key: string, data: T[]) { localStorage.setItem(key, JSON.stringify(data)); }

const BodyTracker: React.FC = () => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [tab, setTab] = useState<'weight' | 'measure' | 'kbju'>('weight');
  const [weights, setWeights] = useState<WeightEntry[]>(loadArr(STORAGE_WEIGHT));
  const [measures, setMeasures] = useState<MeasurementEntry[]>(loadArr(STORAGE_MEASURE));
  const [newWeight, setNewWeight] = useState('');
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  const [mChest, setMChest] = useState(''); const [mWaist, setMWaist] = useState(''); const [mHips, setMHips] = useState(''); const [mArms, setMArms] = useState('');

  // KBJU
  const [kGender, setKGender] = useState<'m'|'f'>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KBJU) || '{}').gender || 'm'; } catch { return 'm'; } });
  const [kAge, setKAge] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KBJU) || '{}').age || 25; } catch { return 25; } });
  const [kHeight, setKHeight] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KBJU) || '{}').height || 175; } catch { return 175; } });
  const [kWeight, setKWeight] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KBJU) || '{}').weight || 75; } catch { return 75; } });
  const [kActivity, setKActivity] = useState(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KBJU) || '{}').activity || 1.55; } catch { return 1.55; } });
  const [kGoal, setKGoal] = useState<'lose'|'maintain'|'gain'>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KBJU) || '{}').goal || 'maintain'; } catch { return 'maintain'; } });

  const bmr = useMemo(() => {
    if (kGender === 'm') return 10 * kWeight + 6.25 * kHeight - 5 * kAge + 5;
    return 10 * kWeight + 6.25 * kHeight - 5 * kAge - 161;
  }, [kGender, kWeight, kHeight, kAge]);
  const tdee = Math.round(bmr * kActivity);
  const targetCal = kGoal === 'lose' ? tdee - 500 : kGoal === 'gain' ? tdee + 400 : tdee;
  const protein = Math.round(kWeight * (kGoal === 'gain' ? 2.2 : 1.8));
  const fat = Math.round(targetCal * 0.25 / 9);
  const carbs = Math.round((targetCal - protein * 4 - fat * 9) / 4);

  const saveKBJU = () => { localStorage.setItem(STORAGE_KBJU, JSON.stringify({ gender: kGender, age: kAge, height: kHeight, weight: kWeight, activity: kActivity, goal: kGoal })); };

  const addWeight = () => {
    const w = parseFloat(newWeight); if (!w) return;
    const entry: WeightEntry = { id: generateId(), date: new Date().toISOString().split('T')[0], weight: w };
    const updated = [entry, ...weights]; setWeights(updated); saveArr(STORAGE_WEIGHT, updated); setNewWeight('');
  };

  const addMeasure = () => {
    const entry: MeasurementEntry = { id: generateId(), date: new Date().toISOString().split('T')[0], chest: parseFloat(mChest) || undefined, waist: parseFloat(mWaist) || undefined, hips: parseFloat(mHips) || undefined, arms: parseFloat(mArms) || undefined };
    const updated = [entry, ...measures]; setMeasures(updated); saveArr(STORAGE_MEASURE, updated);
    setMChest(''); setMWaist(''); setMHips(''); setMArms(''); setShowAddMeasure(false);
  };

  const weightTrend = weights.length >= 2 ? weights[0].weight - weights[1].weight : 0;
  const minW = weights.length ? Math.min(...weights.map(w => w.weight)) : 0;
  const maxW = weights.length ? Math.max(...weights.map(w => w.weight)) : 0;
  const rangeW = maxW - minW || 1;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold" style={{ color: V.text }}>{isRu ? 'Тело и питание' : 'Body & Nutrition'}</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {[
            { id: 'weight' as const, label: isRu ? 'Вес' : 'Weight', icon: <Scale className="w-3.5 h-3.5" /> },
            { id: 'measure' as const, label: isRu ? 'Замеры' : 'Measurements', icon: <Ruler className="w-3.5 h-3.5" /> },
            { id: 'kbju' as const, label: isRu ? 'КБЖУ' : 'KBJU', icon: <Calculator className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={tab === t.id ? { backgroundColor: V.orange, color: V.bg0 } : { backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.textTer }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Weight Tab */}
        {tab === 'weight' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={newWeight} onChange={e => setNewWeight(e.target.value)} type="number" step="0.1" placeholder={isRu ? 'Вес (кг)' : 'Weight (kg)'}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }}
                onKeyDown={e => { if (e.key === 'Enter') addWeight(); }} />
              <button onClick={addWeight} className="px-5 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: V.accent, color: V.bg0 }}>+</button>
            </div>

            {weights.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                    <div className="text-xl font-extrabold" style={{ color: V.text }}>{weights[0].weight}</div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: V.textTer }}>{isRu ? 'Текущий' : 'Current'}</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                    <div className="text-xl font-extrabold flex items-center justify-center gap-1" style={{ color: weightTrend < 0 ? V.success : weightTrend > 0 ? V.danger : V.textSec }}>
                      {weightTrend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(weightTrend).toFixed(1)}
                    </div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: V.textTer }}>{isRu ? 'Изменение' : 'Change'}</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                    <div className="text-xl font-extrabold" style={{ color: V.gold }}>{weights.length}</div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: V.textTer }}>{isRu ? 'Записей' : 'Entries'}</p>
                  </div>
                </div>

                {/* Mini chart */}
                <div className="rounded-xl p-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.border}` }}>
                  <div className="flex items-end gap-1 h-24">
                    {weights.slice(0, 30).reverse().map((w, i) => (
                      <div key={i} className="flex-1 rounded-t transition-all" title={`${w.date}: ${w.weight}kg`}
                        style={{ height: `${((w.weight - minW) / rangeW) * 80 + 20}%`, backgroundColor: i === weights.slice(0,30).length - 1 ? V.accent : `${V.accent}40` }} />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  {weights.slice(0, 10).map(w => (
                    <div key={w.id} className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: V.bg3 }}>
                      <span className="text-xs" style={{ color: V.textSec }}>{w.date}</span>
                      <span className="text-sm font-bold" style={{ color: V.text }}>{w.weight} {isRu ? 'кг' : 'kg'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Measurements Tab */}
        {tab === 'measure' && (
          <div className="space-y-4">
            {!showAddMeasure ? (
              <button onClick={() => setShowAddMeasure(true)} className="w-full py-3 rounded-xl text-xs font-bold" style={{ border: `1px dashed ${V.borderL}`, color: V.textTer }}>
                + {isRu ? 'Добавить замер' : 'Add measurement'}
              </button>
            ) : (
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderL}` }}>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: mChest, s: setMChest, l: isRu ? 'Грудь (см)' : 'Chest (cm)' },
                    { v: mWaist, s: setMWaist, l: isRu ? 'Талия (см)' : 'Waist (cm)' },
                    { v: mHips, s: setMHips, l: isRu ? 'Бёдра (см)' : 'Hips (cm)' },
                    { v: mArms, s: setMArms, l: isRu ? 'Руки (см)' : 'Arms (cm)' },
                  ].map(f => (
                    <input key={f.l} value={f.v} onChange={e => f.s(e.target.value)} type="number" placeholder={f.l}
                      className="px-3 py-2 rounded-xl text-sm outline-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddMeasure(false)} className="px-3 py-1.5 text-xs" style={{ color: V.textTer }}>{isRu ? 'Отмена' : 'Cancel'}</button>
                  <button onClick={addMeasure} className="px-4 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: V.accent, color: V.bg0 }}>{isRu ? 'Сохранить' : 'Save'}</button>
                </div>
              </div>
            )}
            {measures.map(m => (
              <div key={m.id} className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}` }}>
                <span className="text-xs" style={{ color: V.textSec }}>{m.date}</span>
                <div className="flex gap-3 text-xs font-mono" style={{ color: V.text }}>
                  {m.chest && <span>{isRu ? 'Гр' : 'Ch'}:{m.chest}</span>}
                  {m.waist && <span>{isRu ? 'Тл' : 'Wa'}:{m.waist}</span>}
                  {m.hips && <span>{isRu ? 'Бд' : 'Hi'}:{m.hips}</span>}
                  {m.arms && <span>{isRu ? 'Рк' : 'Ar'}:{m.arms}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KBJU Tab */}
        {tab === 'kbju' && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: V.bg2, border: `1px solid ${V.borderL}` }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.textTer }}>{isRu ? 'Пол' : 'Gender'}</label>
                  <div className="flex gap-2">
                    {(['m', 'f'] as const).map(g => (
                      <button key={g} onClick={() => { setKGender(g); saveKBJU(); }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold"
                        style={kGender === g ? { backgroundColor: V.accent, color: V.bg0 } : { backgroundColor: V.bg3, color: V.textTer }}>
                        {g === 'm' ? (isRu ? 'Муж' : 'Male') : (isRu ? 'Жен' : 'Female')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.textTer }}>{isRu ? 'Возраст' : 'Age'}</label>
                  <input type="number" value={kAge} onChange={e => { setKAge(+e.target.value); saveKBJU(); }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.textTer }}>{isRu ? 'Рост (см)' : 'Height (cm)'}</label>
                  <input type="number" value={kHeight} onChange={e => { setKHeight(+e.target.value); saveKBJU(); }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.textTer }}>{isRu ? 'Вес (кг)' : 'Weight (kg)'}</label>
                  <input type="number" value={kWeight} onChange={e => { setKWeight(+e.target.value); saveKBJU(); }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ backgroundColor: V.bg3, border: `1px solid ${V.border}`, color: V.text }} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.textTer }}>{isRu ? 'Активность' : 'Activity'}</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { v: 1.2, l: isRu ? 'Минимум' : 'Sedentary' },
                    { v: 1.375, l: isRu ? 'Лёгкая' : 'Light' },
                    { v: 1.55, l: isRu ? 'Средняя' : 'Moderate' },
                    { v: 1.725, l: isRu ? 'Высокая' : 'Active' },
                    { v: 1.9, l: isRu ? 'Экстрим' : 'Extreme' },
                  ].map(a => (
                    <button key={a.v} onClick={() => { setKActivity(a.v); saveKBJU(); }}
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold"
                      style={kActivity === a.v ? { backgroundColor: V.orange, color: V.bg0 } : { backgroundColor: V.bg3, color: V.textTer }}>
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: V.textTer }}>{isRu ? 'Цель' : 'Goal'}</label>
                <div className="flex gap-2">
                  {[
                    { v: 'lose' as const, l: isRu ? 'Похудеть' : 'Lose', c: V.danger },
                    { v: 'maintain' as const, l: isRu ? 'Поддержать' : 'Maintain', c: V.accent },
                    { v: 'gain' as const, l: isRu ? 'Набрать' : 'Gain', c: V.success },
                  ].map(g => (
                    <button key={g.v} onClick={() => { setKGoal(g.v); saveKBJU(); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold"
                      style={kGoal === g.v ? { backgroundColor: g.c, color: V.bg0 } : { backgroundColor: V.bg3, color: V.textTer }}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: isRu ? 'Калории' : 'Calories', value: `${targetCal}`, unit: isRu ? 'ккал' : 'kcal', color: V.orange },
                { label: isRu ? 'Белки' : 'Protein', value: `${protein}`, unit: isRu ? 'г' : 'g', color: V.danger },
                { label: isRu ? 'Жиры' : 'Fat', value: `${fat}`, unit: isRu ? 'г' : 'g', color: V.gold },
                { label: isRu ? 'Углеводы' : 'Carbs', value: `${carbs}`, unit: isRu ? 'г' : 'g', color: V.success },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                  <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] font-bold uppercase mt-1" style={{ color: V.textTer }}>{s.label} ({s.unit})</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: V.bg3 }}>
              <p className="text-[10px]" style={{ color: V.textDis }}>
                {isRu ? `Базовый метаболизм: ${Math.round(bmr)} ккал · TDEE: ${tdee} ккал` : `BMR: ${Math.round(bmr)} kcal · TDEE: ${tdee} kcal`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyTracker;
