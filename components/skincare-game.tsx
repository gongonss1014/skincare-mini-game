"use client";

import Image from "next/image";
import { PointerEvent, useMemo, useRef, useState } from "react";
import {
  FACE_ZONES,
  GameStep,
  SerumId,
  SERUMS,
  STEP_LABELS,
  averageProgress,
  emptyZoneProgress,
  getZoneAtPoint,
  type FaceZoneKey,
} from "@/lib/game";

type Point = { id: number; x: number; y: number };
type Dot = { zone: FaceZoneKey; x: number; y: number; label?: string };

const SERUM_DROPS: Dot[] = [
  { zone: "forehead", x: 50, y: 35 },
  { zone: "leftCheek", x: 36, y: 49 },
  { zone: "rightCheek", x: 64, y: 49 },
];

const CREAM_DOTS: Dot[] = [
  { zone: "forehead", x: 50, y: 34 },
  { zone: "leftCheek", x: 35, y: 49 },
  { zone: "rightCheek", x: 65, y: 49 },
  { zone: "nose", x: 50, y: 50 },
  { zone: "chin", x: 50, y: 59 },
];

const ORDER: GameStep[] = ["intro", "cleansing", "toner", "serumSelect", "serumApply", "cream", "result"];

function BubbleTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center justify-center rounded-full border-[3px] border-pink-300 bg-white/95 px-5 py-2 text-center text-sm font-black tracking-[.12em] text-pink-600 shadow-[0_4px_0_#f7bfd0] sm:text-base">
      <span className="tiny-stars relative">{children}</span>
    </div>
  );
}

function CharacterStage({
  src,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  cursorPoint,
  tool,
}: {
  src: string;
  children?: React.ReactNode;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLDivElement>) => void;
  cursorPoint?: { x: number; y: number } | null;
  tool?: "foam" | "pad" | "serum" | "cream" | null;
}) {
  return (
    <div
      className="stage-no-select relative mx-auto aspect-[3/4] w-full max-w-[620px] overflow-hidden rounded-[34px] border-[4px] border-pink-200 bg-[radial-gradient(circle_at_50%_34%,#fff_0_23%,#fff7f2_53%,#ffe9f1_100%)] shadow-[inset_0_0_0_3px_rgba(255,255,255,.85),0_14px_35px_rgba(164,75,105,.13)]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="pointer-events-none absolute left-[7%] top-[8%] text-2xl text-pink-300 sparkle">✦</div>
      <div className="pointer-events-none absolute right-[6%] top-[15%] text-3xl text-pink-300 sparkle" style={{ animationDelay: ".5s" }}>♡</div>
      <div className="pointer-events-none absolute bottom-[13%] left-[8%] text-xl text-pink-200 sparkle" style={{ animationDelay: ".9s" }}>✿</div>
      <Image src={src} alt="Skincare game character" fill priority sizes="(max-width: 768px) 92vw, 620px" className="pointer-events-none object-contain object-center" />
      {children}
      {cursorPoint && tool && (
        <div
          className="pointer-events-none absolute z-40"
          style={{ left: `${cursorPoint.x}%`, top: `${cursorPoint.y}%`, transform: "translate(-50%,-50%)" }}
        >
          {tool === "foam" && <div className="text-[38px] drop-shadow-md">🫧</div>}
          {tool === "pad" && <div className="rounded-full border-2 border-pink-300 bg-white/95 px-2 py-1 text-2xl shadow-md">☁️</div>}
          {tool === "serum" && <div className="text-[32px] drop-shadow-md">💧</div>}
          {tool === "cream" && <div className="text-[34px] drop-shadow-md">🤍</div>}
        </div>
      )}
    </div>
  );
}

function GameProgress({ step }: { step: GameStep }) {
  const current = ORDER.indexOf(step);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-black tracking-wide text-pink-700 sm:text-xs">
      {ORDER.map((item, index) => (
        <div className="flex shrink-0 items-center" key={item}>
          <span className={`rounded-full px-2.5 py-1.5 ${index <= current ? "bg-pink-400 text-white shadow-sm" : "bg-pink-100 text-pink-400"}`}>
            {STEP_LABELS[item]}
          </span>
          {index < ORDER.length - 1 && <span className="mx-1 text-pink-300">♥</span>}
        </div>
      ))}
    </div>
  );
}

export function SkincareGame() {
  const [step, setStep] = useState<GameStep>("intro");
  const [cleansing, setCleansing] = useState(emptyZoneProgress);
  const [toner, setToner] = useState<Record<FaceZoneKey, number>>({ forehead: 0, leftCheek: 0, rightCheek: 0, nose: 0, chin: 0 });
  const [serumProgress, setSerumProgress] = useState<Record<FaceZoneKey, number>>({ forehead: 0, leftCheek: 0, rightCheek: 0, nose: 100, chin: 100 });
  const [creamProgress, setCreamProgress] = useState(emptyZoneProgress);
  const [selectedSerum, setSelectedSerum] = useState<SerumId | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [toolSelected, setToolSelected] = useState(false);
  const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number } | null>(null);
  const [foamMarks, setFoamMarks] = useState<Point[]>([]);
  const [drops, setDrops] = useState<Point[]>([]);
  const [tapFlash, setTapFlash] = useState<Point | null>(null);
  const idRef = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const cleansingPct = averageProgress(cleansing);
  const tonerPct = Math.round((Object.values(toner).reduce((a, b) => a + Math.min(b, 3), 0) / 15) * 100);
  const serumPct = Math.round((serumProgress.forehead + serumProgress.leftCheek + serumProgress.rightCheek) / 3);
  const creamPct = averageProgress(creamProgress);

  const cleansingDone = Object.values(cleansing).every((value) => value >= 100);
  const tonerDone = Object.values(toner).every((value) => value >= 3);
  const serumDone = serumProgress.forehead >= 100 && serumProgress.leftCheek >= 100 && serumProgress.rightCheek >= 100;
  const creamDone = Object.values(creamProgress).every((value) => value >= 100);

  const activeSerum = useMemo(() => SERUMS.find((serum) => serum.id === selectedSerum), [selectedSerum]);

  function normalizedPoint(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function shouldTrack(point: { x: number; y: number }) {
    if (!lastPoint.current) return true;
    const dx = point.x - lastPoint.current.x;
    const dy = point.y - lastPoint.current.y;
    return Math.hypot(dx, dy) > 1.2;
  }

  function addFoam(x: number, y: number) {
    idRef.current += 1;
    const mark = { id: idRef.current, x, y };
    setFoamMarks((prev) => [...prev.slice(-80), mark]);
  }

  function addDrop(x: number, y: number) {
    idRef.current += 1;
    const drop = { id: idRef.current, x, y };
    setDrops((prev) => [...prev.slice(-10), drop]);
    window.setTimeout(() => setDrops((prev) => prev.filter((item) => item.id !== drop.id)), 900);
  }

  function handleDrag(e: PointerEvent<HTMLDivElement>, mode: "cleansing" | "serum" | "cream") {
    const point = normalizedPoint(e);
    setCursorPoint(point);
    if (!isDrawing || !shouldTrack(point)) return;
    lastPoint.current = point;
    const zone = getZoneAtPoint(point.x, point.y);
    if (!zone) return;

    if (mode === "cleansing") {
      addFoam(point.x, point.y);
      setCleansing((prev) => ({ ...prev, [zone.key]: Math.min(100, prev[zone.key] + 9) }));
    }
    if (mode === "serum" && ["forehead", "leftCheek", "rightCheek"].includes(zone.key)) {
      setSerumProgress((prev) => ({ ...prev, [zone.key]: Math.min(100, prev[zone.key] + 8) }));
    }
    if (mode === "cream") {
      setCreamProgress((prev) => ({ ...prev, [zone.key]: Math.min(100, prev[zone.key] + 8) }));
    }
  }

  function startDraw(e: PointerEvent<HTMLDivElement>) {
    if (step === "cleansing" && !toolSelected) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const point = normalizedPoint(e);
    setCursorPoint(point);
    lastPoint.current = null;
    setIsDrawing(true);
    if (step === "cleansing") {
      const zone = getZoneAtPoint(point.x, point.y);
      if (zone) {
        addFoam(point.x, point.y);
        setCleansing((prev) => ({ ...prev, [zone.key]: Math.min(100, prev[zone.key] + 9) }));
      }
    }
  }

  function endDraw() {
    setIsDrawing(false);
    lastPoint.current = null;
  }

  function tapToner(e: PointerEvent<HTMLDivElement>) {
    const point = normalizedPoint(e);
    setCursorPoint(point);
    const zone = getZoneAtPoint(point.x, point.y);
    if (!zone) return;
    setToner((prev) => ({ ...prev, [zone.key]: Math.min(3, prev[zone.key] + 1) }));
    idRef.current += 1;
    setTapFlash({ id: idRef.current, x: point.x, y: point.y });
    addDrop(point.x - 2, point.y + 2);
    addDrop(point.x + 3, point.y - 1);
    window.setTimeout(() => setTapFlash(null), 280);
  }

  function resetGame() {
    setStep("intro");
    setCleansing(emptyZoneProgress());
    setToner({ forehead: 0, leftCheek: 0, rightCheek: 0, nose: 0, chin: 0 });
    setSerumProgress({ forehead: 0, leftCheek: 0, rightCheek: 0, nose: 100, chin: 100 });
    setCreamProgress(emptyZoneProgress());
    setSelectedSerum(null);
    setToolSelected(false);
    setFoamMarks([]);
    setDrops([]);
    setCursorPoint(null);
  }

  const stageHandlers = {
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      if (step === "toner") tapToner(e);
      else startDraw(e);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      const p = normalizedPoint(e);
      setCursorPoint(p);
      if (step === "cleansing") handleDrag(e, "cleansing");
      if (step === "serumApply") handleDrag(e, "serum");
      if (step === "cream") handleDrag(e, "cream");
    },
    onPointerUp: endDraw,
  };

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <section className="pixel-window mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1180px] flex-col overflow-hidden p-3 pt-12 sm:min-h-[calc(100vh-3rem)] sm:p-5 sm:pt-12">
        <header className="mb-3 flex flex-col gap-3 border-b-2 border-dashed border-pink-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[.24em] text-pink-400">♡ SKINCARE PLAYGROUND ♡</p>
            <h1 className="mt-1 text-xl font-black text-pink-600 sm:text-2xl">MY BEAUTY ROOM</h1>
          </div>
          <GameProgress step={step} />
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative flex min-h-[540px] items-center justify-center rounded-[28px] bg-[linear-gradient(160deg,rgba(255,235,243,.82),rgba(255,250,244,.96))] p-2 sm:p-4">
            {step === "intro" && (
              <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-[24px]">
                <Image src="/assets/beauty-room.png" alt="My Beauty Room" fill priority sizes="(max-width: 1024px) 100vw, 760px" className="object-cover object-top opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-100/80 via-white/10 to-white/5" />
                <div className="relative z-10 mt-auto flex w-full max-w-xl flex-col items-center px-5 pb-8 pt-[46vh] text-center sm:pb-12">
                  <div className="dialogue-box w-full p-4 sm:p-5">
                    <p className="text-xs font-black tracking-[.18em] text-pink-400">오늘 피부 고민 : DRYNESS</p>
                    <p className="mt-2 text-xl font-black sm:text-2xl">핑크랑 같이 스킨케어 해볼래? ♡</p>
                    <p className="mt-2 text-sm font-bold text-pink-700/70">얼굴을 직접 닦고, 톡톡 두드리고, 세럼과 크림을 발라줘!</p>
                  </div>
                  <button className="glossy-button mt-5 px-10 py-3 text-lg" onClick={() => setStep("cleansing")}>GAME START ♡</button>
                </div>
              </div>
            )}

            {step === "cleansing" && (
              <CharacterStage src="/assets/character-base.png" {...stageHandlers} cursorPoint={cursorPoint} tool={toolSelected ? "foam" : null}>
                {foamMarks.map((mark) => <span key={mark.id} className="foam-mark" style={{ left: `${mark.x}%`, top: `${mark.y}%` }} />)}
              </CharacterStage>
            )}

            {step === "toner" && (
              <CharacterStage src="/assets/character-base.png" {...stageHandlers} cursorPoint={cursorPoint} tool="pad">
                {tapFlash && <div className="pointer-events-none absolute z-30 h-16 w-16 rounded-full border-[5px] border-white/90 bg-pink-100/60 shadow-lg" style={{ left: `${tapFlash.x}%`, top: `${tapFlash.y}%`, animation: "tonerBounce .28s ease" }} />}
                {drops.map((drop) => <span key={drop.id} className="water-drop" style={{ left: `${drop.x}%`, top: `${drop.y}%` }}>💧</span>)}
              </CharacterStage>
            )}

            {step === "serumSelect" && (
              <div className="flex h-full w-full flex-col items-center justify-center px-3 py-8 sm:px-8">
                <BubbleTitle>SERUM SELECT</BubbleTitle>
                <div className="mt-6 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
                  {SERUMS.map((serum) => (
                    <button
                      key={serum.id}
                      onClick={() => setSelectedSerum(serum.id)}
                      className={`game-card-bottle relative min-h-[250px] rounded-[30px] p-4 text-center transition duration-150 hover:-translate-y-1 active:translate-y-0 ${selectedSerum === serum.id ? "ring-4 ring-pink-400 ring-offset-4" : ""}`}
                    >
                      {serum.best && <span className="absolute -right-2 -top-3 rotate-6 rounded-full border-2 border-pink-500 bg-yellow-100 px-3 py-1 text-[11px] font-black text-pink-600 shadow-sm">BEST MATCH ♡</span>}
                      <div className="mx-auto mt-2 flex h-28 w-20 items-center justify-center rounded-[24px_24px_30px_30px] border-[4px] border-white bg-gradient-to-b from-white to-pink-100 text-5xl shadow-[0_8px_0_#eaa2b9]">{serum.icon}</div>
                      <div className="mx-auto -mt-1 h-5 w-10 rounded-t-lg bg-pink-500" />
                      <p className="mt-5 text-base font-black text-pink-700">{serum.title}</p>
                      <p className="mt-1 text-xs font-black tracking-wide text-pink-500">{serum.ingredient}</p>
                      <p className="mt-3 text-xs font-bold text-pink-800/65">{serum.note}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-center text-sm font-bold text-pink-700/70">건조함에는 HYDRATION이 가장 잘 맞지만, 다른 세럼을 골라도 괜찮아!</p>
              </div>
            )}

            {step === "serumApply" && (
              <CharacterStage src="/assets/character-base.png" {...stageHandlers} cursorPoint={cursorPoint} tool="serum">
                {SERUM_DROPS.map((dot) => (
                  <div key={dot.zone} className="pointer-events-none absolute z-20 text-[38px] drop-shadow-sm transition-opacity duration-200" style={{ left: `${dot.x}%`, top: `${dot.y}%`, transform: "translate(-50%,-50%)", opacity: 1 - serumProgress[dot.zone] / 100 }}>💧</div>
                ))}
              </CharacterStage>
            )}

            {step === "cream" && (
              <CharacterStage src="/assets/character-base.png" {...stageHandlers} cursorPoint={cursorPoint} tool="cream">
                {CREAM_DOTS.map((dot) => (
                  <div key={dot.zone} className="pointer-events-none absolute z-20 h-10 w-12 rounded-[50%] bg-white shadow-[0_3px_8px_rgba(169,107,129,.22)] transition-opacity duration-200" style={{ left: `${dot.x}%`, top: `${dot.y}%`, transform: "translate(-50%,-50%)", opacity: 1 - creamProgress[dot.zone] / 100 }} />
                ))}
              </CharacterStage>
            )}

            {step === "result" && (
              <div className="relative flex h-full w-full flex-col items-center justify-center">
                <CharacterStage src="/assets/character-complete.png">
                  <div className="pointer-events-none absolute inset-0">
                    <span className="sparkle absolute left-[12%] top-[24%] text-4xl text-pink-300">✦</span>
                    <span className="sparkle absolute right-[12%] top-[34%] text-5xl text-pink-300" style={{ animationDelay: ".4s" }}>✧</span>
                    <span className="sparkle absolute left-[17%] top-[48%] text-3xl text-pink-300" style={{ animationDelay: ".7s" }}>♡</span>
                  </div>
                </CharacterStage>
                <div className="pointer-events-none absolute left-1/2 top-[5%] z-30 -translate-x-1/2 rounded-full border-[4px] border-pink-400 bg-white/95 px-6 py-3 text-center shadow-[0_6px_0_#f5b4c8]">
                  <p className="text-xl font-black tracking-wider text-pink-600 sm:text-2xl">SKINCARE CLEAR!</p>
                </div>
              </div>
            )}
          </div>

          <aside className="flex flex-col rounded-[28px] border-[3px] border-pink-200 bg-white/80 p-4 shadow-[inset_0_0_0_3px_rgba(255,255,255,.8)] sm:p-5">
            {step === "intro" && (
              <>
                <BubbleTitle>READY?</BubbleTitle>
                <div className="mt-5 overflow-hidden rounded-[24px] border-2 border-pink-200 bg-pink-50">
                  <Image src="/assets/character-dry.png" width={1087} height={1447} alt="Dry skin starting state" className="h-auto w-full" />
                </div>
                <div className="dialogue-box mt-4 p-4 text-sm font-bold leading-6">“볼이 조금 건조해 보여! 오늘은 수분을 차곡차곡 채워보자 ♡”</div>
              </>
            )}

            {step === "cleansing" && (
              <>
                <BubbleTitle>STEP 1 · CLEANSING</BubbleTitle>
                <h2 className="mt-5 text-xl font-black">거품으로 얼굴을 깨끗하게!</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-pink-800/70">클렌저를 고른 다음 얼굴 위를 클릭하고 드래그해줘. 이마·양 볼·코·턱을 골고루 닦으면 완료!</p>
                <button onClick={() => setToolSelected(true)} className={`mt-5 rounded-[26px] border-[3px] p-4 text-left transition ${toolSelected ? "border-pink-500 bg-pink-100 shadow-[0_5px_0_#efabc1]" : "border-pink-200 bg-white hover:bg-pink-50"}`}>
                  <div className="flex items-center gap-3"><span className="text-4xl">🫧</span><div><p className="font-black">MILKY FOAM CLEANSER</p><p className="text-xs font-bold text-pink-600">선택해서 거품 도구 장착하기</p></div></div>
                </button>
                <Progress value={cleansingPct} />
                <ZoneChecklist values={cleansing} max={100} />
                {cleansingDone && <SuccessMessage title="CLEAN! ♡" subtitle="반짝반짝, 세안 완료!" />}
                <button className="glossy-button mt-auto px-5 py-3" disabled={!cleansingDone} onClick={() => { setStep("toner"); setCursorPoint(null); }}>NEXT · TONER ♡</button>
              </>
            )}

            {step === "toner" && (
              <>
                <BubbleTitle>STEP 2 · TONER</BubbleTitle>
                <h2 className="mt-5 text-xl font-black">화장솜으로 톡톡!</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-pink-800/70">각 부위를 3번씩 눌러 수분을 채워줘. 탭할 때마다 물방울이 뿅!</p>
                <Progress value={tonerPct} />
                <ZoneChecklist values={toner} max={3} unit="tap" />
                {tonerDone && <SuccessMessage title="HYDRATION +20" subtitle="피부가 촉촉해졌어!" />}
                <button className="glossy-button mt-auto px-5 py-3" disabled={!tonerDone} onClick={() => { setStep("serumSelect"); setCursorPoint(null); }}>NEXT · SERUM ♡</button>
              </>
            )}

            {step === "serumSelect" && (
              <>
                <BubbleTitle>STEP 3 · PICK ONE</BubbleTitle>
                <h2 className="mt-5 text-xl font-black">오늘의 세럼은?</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-pink-800/70">피부 고민은 <span className="text-pink-600">DRYNESS</span>. HYDRATION에 추천 표시가 있지만 원하는 걸 골라도 진행할 수 있어.</p>
                {activeSerum && (
                  <div className="dialogue-box mt-5 p-4 text-center">
                    <div className="text-4xl">{activeSerum.icon}</div>
                    <p className="mt-2 font-black text-pink-600">{activeSerum.title}</p>
                    <p className="text-xs font-bold text-pink-700/70">{activeSerum.ingredient}</p>
                  </div>
                )}
                <button className="glossy-button mt-auto px-5 py-3" disabled={!selectedSerum} onClick={() => setStep("serumApply")}>APPLY THIS SERUM ♡</button>
              </>
            )}

            {step === "serumApply" && (
              <>
                <BubbleTitle>STEP 4 · SERUM</BubbleTitle>
                <h2 className="mt-5 text-xl font-black">세럼 방울을 쏙 흡수!</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-pink-800/70">이마와 양 볼에 놓인 세럼 방울 위를 드래그해 흡수시켜줘. 방울이 점점 투명해질 거야.</p>
                {activeSerum && <div className="mt-4 rounded-2xl bg-pink-50 p-3 text-center text-xs font-black text-pink-600">NOW USING · {activeSerum.title} / {activeSerum.ingredient}</div>}
                <Progress value={serumPct} />
                <MiniThree values={serumProgress} />
                {serumDone && <SuccessMessage title="ABSORBED! ♡" subtitle="세럼 흡수 완료!" />}
                <button className="glossy-button mt-auto px-5 py-3" disabled={!serumDone} onClick={() => { setStep("cream"); setCursorPoint(null); }}>NEXT · CREAM ♡</button>
              </>
            )}

            {step === "cream" && (
              <>
                <BubbleTitle>STEP 5 · CREAM</BubbleTitle>
                <h2 className="mt-5 text-xl font-black">수분 잠금 마무리!</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-pink-800/70">크림 점을 부드럽게 문질러 펴 발라줘. 얼굴 다섯 부위를 모두 블렌딩하면 끝!</p>
                <Progress value={creamPct} />
                <ZoneChecklist values={creamProgress} max={100} />
                {creamDone && <SuccessMessage title="BARRIER LOCK ♡" subtitle="마지막 보습막까지 완성!" />}
                <button className="glossy-button mt-auto px-5 py-3" disabled={!creamDone} onClick={() => { setStep("result"); setCursorPoint(null); }}>SEE RESULT ♡</button>
              </>
            )}

            {step === "result" && (
              <>
                <BubbleTitle>ROUTINE COMPLETE</BubbleTitle>
                <div className="mt-5 text-center">
                  <p className="text-3xl font-black text-pink-600">+120 BEAUTY XP</p>
                  <p className="mt-1 text-xs font-black tracking-[.18em] text-pink-400">GOOD SKIN · GOOD MOOD</p>
                </div>
                <div className="mt-6 space-y-4">
                  <Stat label="Hydration" value={90} />
                  <Stat label="Calming" value={75} />
                  <Stat label="Barrier" value={82} />
                </div>
                <div className="dialogue-box mt-6 p-4 text-center text-sm font-black">오늘 루틴 완료! 피부가 반짝반짝해졌어 ✨</div>
                <button className="glossy-button mt-6 px-5 py-3">추천 제품 보기 ♡</button>
                <button className="mt-4 rounded-full border-2 border-pink-200 bg-white px-5 py-3 text-sm font-black text-pink-600 hover:bg-pink-50" onClick={resetGame}>처음부터 다시하기</button>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-xs font-black text-pink-600"><span>PROGRESS</span><span>{Math.min(100, value)}%</span></div>
      <div className="progress-shell h-7"><div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} /></div>
    </div>
  );
}

function ZoneChecklist({ values, max, unit }: { values: Record<FaceZoneKey, number>; max: number; unit?: "tap" }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-black">
      {FACE_ZONES.map((zone) => {
        const done = values[zone.key] >= max;
        return (
          <div key={zone.key} className={`rounded-xl border-2 px-3 py-2 ${done ? "border-pink-300 bg-pink-100 text-pink-700" : "border-pink-100 bg-white text-pink-400"}`}>
            {done ? "♥" : "♡"} {zone.label} {unit ? `${Math.min(values[zone.key], max)}/${max}` : `${Math.min(values[zone.key], max)}%`}
          </div>
        );
      })}
    </div>
  );
}

function MiniThree({ values }: { values: Record<FaceZoneKey, number> }) {
  const items: Array<[FaceZoneKey, string]> = [["forehead", "이마"], ["leftCheek", "왼볼"], ["rightCheek", "오른볼"]];
  return <div className="mt-5 grid grid-cols-3 gap-2">{items.map(([key, label]) => <div key={key} className="rounded-xl bg-pink-50 p-2 text-center text-xs font-black text-pink-600">{label}<br />{values[key]}%</div>)}</div>;
}

function SuccessMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-5 rounded-[24px] border-[3px] border-pink-400 bg-gradient-to-b from-white to-pink-100 p-4 text-center shadow-[0_5px_0_#f1b0c5]" style={{ animation: "popIn .35s ease-out" }}>
      <p className="text-xl font-black text-pink-600">{title}</p>
      <p className="mt-1 text-xs font-bold text-pink-700/65">{subtitle}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm font-black"><span>{label}</span><span className="text-pink-600">{value}</span></div>
      <div className="h-4 rounded-full border-2 border-pink-200 bg-pink-50 p-[2px]"><div className="h-full rounded-full bg-gradient-to-r from-pink-300 to-pink-500" style={{ width: `${value}%` }} /></div>
    </div>
  );
}
