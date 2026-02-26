import React, { useMemo, useState } from 'react';

const INSTAGRAM_URL = 'https://www.instagram.com/remont_odessa_legko/';

const TURNKEY_PRICES = {
  objectType: {
    apartment: 1,
    house: 1.12,
    commercial: 1.18,
  },
  condition: {
    newbuild: 1,
    secondary: 1.15,
    demolished: 1.28,
  },
  level: {
    economy: { min: 7500, max: 9800 },
    standard: { min: 9800, max: 13200 },
    premium: { min: 13200, max: 18500 },
  },
};

const FINISHING_PRICES = {
  walls: {
    putty: { min: 180, max: 260 },
    paint: { min: 160, max: 250 },
    wallpaper: { min: 170, max: 290 },
    drywall: { min: 420, max: 650 },
  },
  ceiling: {
    stretch: { min: 350, max: 520 },
    paint: { min: 180, max: 280 },
    gkl: { min: 420, max: 640 },
  },
  floor: {
    screed: { min: 250, max: 380 },
    laminate: { min: 240, max: 360 },
    tile: { min: 420, max: 680 },
  },
  urgencyCoef: 1.2,
  complexityCoef: 1.18,
};

const ELECTRIC_PRICES = {
  sockets: { min: 380, max: 580 },
  switches: { min: 320, max: 520 },
  lights: { min: 420, max: 700 },
  floorHeating: { min: 1300, max: 2100 },
  panel: { min: 4200, max: 7800 },
  wiringMode: {
    none: 1,
    partial: 1.22,
    full: 1.55,
  },
};

const PLUMBING_PRICES = {
  toilet: { min: 1800, max: 2800 },
  sink: { min: 1400, max: 2400 },
  shower: { min: 3200, max: 5200 },
  bathtub: { min: 3400, max: 5600 },
  boiler: { min: 2200, max: 3600 },
  washer: { min: 1200, max: 2100 },
  pipesPerMeter: { min: 320, max: 560 },
  grooveCoef: 1.2,
};

const SERVICES = {
  turnkey: {
    title: '🏠 Ремонт под ключ',
    steps: 4,
  },
  finishing: {
    title: '🎨 Отделочные работы',
    steps: 3,
  },
  electric: {
    title: '⚡ Электрика',
    steps: 1,
  },
  plumbing: {
    title: '🚿 Сантехника',
    steps: 1,
  },
};

const ZONE_SERVICE_OPTIONS = {
  walls: [
    { key: 'putty', label: 'Шпаклёвка' },
    { key: 'paint', label: 'Покраска' },
    { key: 'wallpaper', label: 'Обои' },
    { key: 'drywall', label: 'Гипсокартон' },
  ],
  ceiling: [
    { key: 'stretch', label: 'Натяжной' },
    { key: 'paint', label: 'Покраска' },
    { key: 'gkl', label: 'ГКЛ' },
  ],
  floor: [
    { key: 'screed', label: 'Стяжка' },
    { key: 'laminate', label: 'Ламинат' },
    { key: 'tile', label: 'Плитка' },
  ],
};

const INITIAL_TURNKEY = { objectType: '', area: '', condition: '', level: '' };

const INITIAL_FINISHING = {
  zone: '',
  service: '',
  area: '',
  urgency: false,
  complexity: false,
};

const INITIAL_ELECTRIC = {
  sockets: 0,
  switches: 0,
  lights: 0,
  floorHeating: 0,
  panel: 0,
  wiringMode: 'none',
};

const INITIAL_PLUMBING = {
  toilet: 0,
  sink: 0,
  shower: 0,
  bathtub: 0,
  boiler: 0,
  washer: 0,
  pipesMeters: 0,
  grooving: false,
};

const INITIAL_ESTIMATE = {
  finishing: null,
  electric: null,
  plumbing: null,
};

const formatUAH = (value) => `${Math.round(value).toLocaleString('uk-UA')} грн`;

const getRangeLabel = (min, max) => `от ${formatUAH(min)} до ${formatUAH(max)}`;

const getShortRangeLabel = (min, max) => `${Math.round(min).toLocaleString('uk-UA')}–${Math.round(max).toLocaleString('uk-UA')} грн`;

const clampToNonNegative = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

const calculateTurnkey = ({ objectType, area, condition, level }) => {
  const safeArea = clampToNonNegative(area);
  const levelPrice = TURNKEY_PRICES.level[level];

  if (!levelPrice || !safeArea || !objectType || !condition) {
    return null;
  }

  const typeCoef = TURNKEY_PRICES.objectType[objectType] ?? 1;
  const conditionCoef = TURNKEY_PRICES.condition[condition] ?? 1;
  const totalCoef = typeCoef * conditionCoef;

  return {
    min: safeArea * levelPrice.min * totalCoef,
    max: safeArea * levelPrice.max * totalCoef,
  };
};

const calculateFinishing = ({ zone, service, area, urgency, complexity }) => {
  const safeArea = clampToNonNegative(area);
  const base = FINISHING_PRICES[zone]?.[service];

  if (!base || !safeArea) {
    return null;
  }

  const coef =
    (urgency ? FINISHING_PRICES.urgencyCoef : 1) *
    (complexity ? FINISHING_PRICES.complexityCoef : 1);

  return {
    min: safeArea * base.min * coef,
    max: safeArea * base.max * coef,
  };
};

const calculateElectric = ({ sockets, switches, lights, floorHeating, panel, wiringMode }) => {
  const safeValues = {
    sockets: clampToNonNegative(sockets),
    switches: clampToNonNegative(switches),
    lights: clampToNonNegative(lights),
    floorHeating: clampToNonNegative(floorHeating),
    panel: clampToNonNegative(panel),
  };

  const min =
    safeValues.sockets * ELECTRIC_PRICES.sockets.min +
    safeValues.switches * ELECTRIC_PRICES.switches.min +
    safeValues.lights * ELECTRIC_PRICES.lights.min +
    safeValues.floorHeating * ELECTRIC_PRICES.floorHeating.min +
    safeValues.panel * ELECTRIC_PRICES.panel.min;

  const max =
    safeValues.sockets * ELECTRIC_PRICES.sockets.max +
    safeValues.switches * ELECTRIC_PRICES.switches.max +
    safeValues.lights * ELECTRIC_PRICES.lights.max +
    safeValues.floorHeating * ELECTRIC_PRICES.floorHeating.max +
    safeValues.panel * ELECTRIC_PRICES.panel.max;

  const coef = ELECTRIC_PRICES.wiringMode[wiringMode] ?? 1;

  return {
    min: min * coef,
    max: max * coef,
  };
};

const calculatePlumbing = ({ toilet, sink, shower, bathtub, boiler, washer, pipesMeters, grooving }) => {
  const safeValues = {
    toilet: clampToNonNegative(toilet),
    sink: clampToNonNegative(sink),
    shower: clampToNonNegative(shower),
    bathtub: clampToNonNegative(bathtub),
    boiler: clampToNonNegative(boiler),
    washer: clampToNonNegative(washer),
    pipesMeters: clampToNonNegative(pipesMeters),
  };

  const min =
    safeValues.toilet * PLUMBING_PRICES.toilet.min +
    safeValues.sink * PLUMBING_PRICES.sink.min +
    safeValues.shower * PLUMBING_PRICES.shower.min +
    safeValues.bathtub * PLUMBING_PRICES.bathtub.min +
    safeValues.boiler * PLUMBING_PRICES.boiler.min +
    safeValues.washer * PLUMBING_PRICES.washer.min +
    safeValues.pipesMeters * PLUMBING_PRICES.pipesPerMeter.min;

  const max =
    safeValues.toilet * PLUMBING_PRICES.toilet.max +
    safeValues.sink * PLUMBING_PRICES.sink.max +
    safeValues.shower * PLUMBING_PRICES.shower.max +
    safeValues.bathtub * PLUMBING_PRICES.bathtub.max +
    safeValues.boiler * PLUMBING_PRICES.boiler.max +
    safeValues.washer * PLUMBING_PRICES.washer.max +
    safeValues.pipesMeters * PLUMBING_PRICES.pipesPerMeter.max;

  const coef = grooving ? PLUMBING_PRICES.grooveCoef : 1;

  return {
    min: min * coef,
    max: max * coef,
  };
};

function OptionButton({ active, onClick, children }) {
  return (
    <button type="button" className={`option-button ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Counter({ label, value, onChange }) {
  const setSafeValue = (next) => onChange(next < 0 ? 0 : next);

  return (
    <div className="counter-row">
      <span>{label}</span>
      <div className="counter-controls">
        <button type="button" onClick={() => setSafeValue(value - 1)}>
          −
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={() => setSafeValue(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function App() {
  const [activeService, setActiveService] = useState(null);

  const [turnkeyStep, setTurnkeyStep] = useState(1);
  const [turnkey, setTurnkey] = useState(INITIAL_TURNKEY);
  const [turnkeyCalculated, setTurnkeyCalculated] = useState(false);

  const [finishingStep, setFinishingStep] = useState(1);
  const [finishing, setFinishing] = useState(INITIAL_FINISHING);

  const [electric, setElectric] = useState(INITIAL_ELECTRIC);

  const [plumbing, setPlumbing] = useState(INITIAL_PLUMBING);

  const [estimate, setEstimate] = useState(INITIAL_ESTIMATE);

  const turnkeyResult = useMemo(() => calculateTurnkey(turnkey), [turnkey]);
  const finishingResult = useMemo(() => calculateFinishing(finishing), [finishing]);
  const electricResult = useMemo(() => calculateElectric(electric), [electric]);
  const plumbingResult = useMemo(() => calculatePlumbing(plumbing), [plumbing]);

  const availableServices = finishing.zone ? ZONE_SERVICE_OPTIONS[finishing.zone] : [];

  const resetAllState = () => {
    setTurnkeyStep(1);
    setTurnkey(INITIAL_TURNKEY);
    setTurnkeyCalculated(false);

    setFinishingStep(1);
    setFinishing(INITIAL_FINISHING);

    setElectric(INITIAL_ELECTRIC);

    setPlumbing(INITIAL_PLUMBING);
  };

  const resetToMain = () => {
    setActiveService(null);
    resetAllState();
  };

  const openService = (serviceKey) => {
    resetAllState();
    setActiveService(serviceKey);
  };

  const updateNumberInput = (setter, field) => (event) => {
    const value = event.target.value;
    if (value === '') {
      setter((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const numericValue = Number(value);
    setter((prev) => ({ ...prev, [field]: numericValue < 0 ? 0 : numericValue }));
  };

  const canMoveTurnkeyNext =
    (turnkeyStep === 1 && Boolean(turnkey.objectType)) ||
    (turnkeyStep === 2 && Number(turnkey.area) > 0) ||
    (turnkeyStep === 3 && Boolean(turnkey.condition));

  const canMoveFinishingNext =
    (finishingStep === 1 && Boolean(finishing.zone)) ||
    (finishingStep === 2 && Boolean(finishing.service));

  const estimateItems = [
    { key: 'finishing', label: 'Отделка', value: estimate.finishing },
    { key: 'electric', label: 'Электрика', value: estimate.electric },
    { key: 'plumbing', label: 'Сантехника', value: estimate.plumbing },
  ];
  const hasEstimate = estimateItems.some((item) => item.value);
  const estimateTotals = estimateItems.reduce(
    (totals, item) => {
      if (!item.value) {
        return totals;
      }
      return {
        min: totals.min + item.value.min,
        max: totals.max + item.value.max,
      };
    },
    { min: 0, max: 0 },
  );

  const handleFinishingCalculate = () => {
    if (finishingResult) {
      setEstimate((prev) => ({ ...prev, finishing: finishingResult }));
    }
  };

  const handleElectricCalculate = () => {
    if (electricResult) {
      setEstimate((prev) => ({ ...prev, electric: electricResult }));
    }
  };

  const handlePlumbingCalculate = () => {
    if (plumbingResult) {
      setEstimate((prev) => ({ ...prev, plumbing: plumbingResult }));
    }
  };

  const handleEstimateReset = () => {
    setEstimate(INITIAL_ESTIMATE);
    setFinishing(INITIAL_FINISHING);
    setElectric(INITIAL_ELECTRIC);
    setPlumbing(INITIAL_PLUMBING);
    setActiveService(null);
  };

  return (
    <div className="app">
      <header className="brand">remont_odessa_legko</header>

      <main className="content">
        {!activeService ? (
          <section className="card">
            <h1>Рассчитайте стоимость ремонта за 1 минуту</h1>
            <div className="grid">
              {Object.entries(SERVICES).map(([key, item]) => (
                <OptionButton key={key} onClick={() => openService(key)}>
                  {item.title}
                </OptionButton>
              ))}
            </div>
          </section>
        ) : null}

        {activeService === 'turnkey' ? (
          <section className="card">
            <h2>🏠 Ремонт под ключ</h2>
            <p className="step">Шаг {turnkeyStep} из 4</p>

            {turnkeyStep === 1 ? (
              <div className="grid">
                <OptionButton active={turnkey.objectType === 'apartment'} onClick={() => setTurnkey((prev) => ({ ...prev, objectType: 'apartment' }))}>
                  Квартира
                </OptionButton>
                <OptionButton active={turnkey.objectType === 'house'} onClick={() => setTurnkey((prev) => ({ ...prev, objectType: 'house' }))}>
                  Дом
                </OptionButton>
                <OptionButton active={turnkey.objectType === 'commercial'} onClick={() => setTurnkey((prev) => ({ ...prev, objectType: 'commercial' }))}>
                  Коммерция
                </OptionButton>
              </div>
            ) : null}

            {turnkeyStep === 2 ? (
              <label className="input-label">
                Площадь м²
                <input type="number" min="0" value={turnkey.area} onChange={updateNumberInput(setTurnkey, 'area')} />
              </label>
            ) : null}

            {turnkeyStep === 3 ? (
              <div className="grid">
                <OptionButton active={turnkey.condition === 'newbuild'} onClick={() => setTurnkey((prev) => ({ ...prev, condition: 'newbuild' }))}>
                  Новостройка
                </OptionButton>
                <OptionButton active={turnkey.condition === 'secondary'} onClick={() => setTurnkey((prev) => ({ ...prev, condition: 'secondary' }))}>
                  Вторичка
                </OptionButton>
                <OptionButton active={turnkey.condition === 'demolished'} onClick={() => setTurnkey((prev) => ({ ...prev, condition: 'demolished' }))}>
                  После демонтажа
                </OptionButton>
              </div>
            ) : null}

            {turnkeyStep === 4 ? (
              <>
                <div className="grid">
                  <OptionButton active={turnkey.level === 'economy'} onClick={() => setTurnkey((prev) => ({ ...prev, level: 'economy' }))}>
                    Эконом
                  </OptionButton>
                  <OptionButton active={turnkey.level === 'standard'} onClick={() => setTurnkey((prev) => ({ ...prev, level: 'standard' }))}>
                    Стандарт
                  </OptionButton>
                  <OptionButton active={turnkey.level === 'premium'} onClick={() => setTurnkey((prev) => ({ ...prev, level: 'premium' }))}>
                    Премиум
                  </OptionButton>
                </div>
                <button type="button" className="primary" onClick={() => setTurnkeyCalculated(true)} disabled={!turnkey.level || Number(turnkey.area) <= 0}>
                  👉 Рассчитать
                </button>
              </>
            ) : null}

            <div className="actions">
              <button type="button" onClick={() => (turnkeyStep > 1 ? setTurnkeyStep((prev) => prev - 1) : resetToMain())}>
                {turnkeyStep > 1 ? 'Назад' : '⬅ На главный экран'}
              </button>
              {turnkeyStep < 4 ? (
                <button type="button" onClick={() => setTurnkeyStep((prev) => prev + 1)} disabled={!canMoveTurnkeyNext}>
                  Далее
                </button>
              ) : null}
            </div>

            {turnkeyCalculated && turnkeyResult ? (
              <div className="result turnkey-result">
                <p className="turnkey-result-note">Расчёт сохранён. Для точной сметы свяжитесь с нами.</p>
                <div className="result-actions">
                  <button type="button" onClick={() => window.alert('Скоро свяжемся для точной сметы!')}>
                    Получить точную смету
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeService === 'finishing' ? (
          <section className="card">
            <h2>🎨 Отделочные работы</h2>
            <p className="step">Шаг {finishingStep} из 3</p>

            {finishingStep === 1 ? (
              <div className="grid">
                <OptionButton
                  active={finishing.zone === 'walls'}
                  onClick={() => setFinishing((prev) => ({ ...prev, zone: 'walls', service: '' }))}
                >
                  Стены
                </OptionButton>
                <OptionButton
                  active={finishing.zone === 'ceiling'}
                  onClick={() => setFinishing((prev) => ({ ...prev, zone: 'ceiling', service: '' }))}
                >
                  Потолок
                </OptionButton>
                <OptionButton
                  active={finishing.zone === 'floor'}
                  onClick={() => setFinishing((prev) => ({ ...prev, zone: 'floor', service: '' }))}
                >
                  Пол
                </OptionButton>
              </div>
            ) : null}

            {finishingStep === 2 ? (
              <div className="grid">
                {availableServices.map((item) => (
                  <OptionButton
                    key={item.key}
                    active={finishing.service === item.key}
                    onClick={() => setFinishing((prev) => ({ ...prev, service: item.key }))}
                  >
                    {item.label}
                  </OptionButton>
                ))}
              </div>
            ) : null}

            {finishingStep === 3 ? (
              <>
                <label className="input-label">
                  Площадь м²
                  <input type="number" min="0" value={finishing.area} onChange={updateNumberInput(setFinishing, 'area')} />
                </label>
                <div className="checks">
                  <label>
                    <input
                      type="checkbox"
                      checked={finishing.urgency}
                      onChange={(event) => setFinishing((prev) => ({ ...prev, urgency: event.target.checked }))}
                    />
                    Срочность
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={finishing.complexity}
                      onChange={(event) => setFinishing((prev) => ({ ...prev, complexity: event.target.checked }))}
                    />
                    Сложность
                  </label>
                </div>
                <button type="button" className="primary" onClick={handleFinishingCalculate} disabled={Number(finishing.area) <= 0}>
                  👉 Рассчитать
                </button>
              </>
            ) : null}

            <div className="actions">
              <button
                type="button"
                onClick={() => (finishingStep > 1 ? setFinishingStep((prev) => prev - 1) : resetToMain())}
              >
                {finishingStep > 1 ? 'Назад' : '⬅ На главный экран'}
              </button>
              {finishingStep < 3 ? (
                <button type="button" onClick={() => setFinishingStep((prev) => prev + 1)} disabled={!canMoveFinishingNext}>
                  Далее
                </button>
              ) : null}
            </div>

          </section>
        ) : null}

        {activeService === 'electric' ? (
          <section className="card">
            <h2>⚡ Электрика</h2>
            <div className="stack">
              <Counter label="Розетки" value={electric.sockets} onChange={(value) => setElectric((prev) => ({ ...prev, sockets: value }))} />
              <Counter label="Выключатели" value={electric.switches} onChange={(value) => setElectric((prev) => ({ ...prev, switches: value }))} />
              <Counter label="Светильники" value={electric.lights} onChange={(value) => setElectric((prev) => ({ ...prev, lights: value }))} />
              <Counter
                label="Тёплый пол"
                value={electric.floorHeating}
                onChange={(value) => setElectric((prev) => ({ ...prev, floorHeating: value }))}
              />
              <Counter label="Щиток" value={electric.panel} onChange={(value) => setElectric((prev) => ({ ...prev, panel: value }))} />
            </div>

            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={electric.wiringMode === 'none'}
                  onChange={() => setElectric((prev) => ({ ...prev, wiringMode: 'none' }))}
                />
                Не требуется
              </label>
              <label>
                <input
                  type="radio"
                  checked={electric.wiringMode === 'partial'}
                  onChange={() => setElectric((prev) => ({ ...prev, wiringMode: 'partial' }))}
                />
                Частичная замена
              </label>
              <label>
                <input
                  type="radio"
                  checked={electric.wiringMode === 'full'}
                  onChange={() => setElectric((prev) => ({ ...prev, wiringMode: 'full' }))}
                />
                Новая проводка
              </label>
            </div>

            <button type="button" className="primary" onClick={handleElectricCalculate}>
              👉 Рассчитать
            </button>
            <div className="actions">
              <button type="button" onClick={resetToMain}>
                ⬅ На главный экран
              </button>
            </div>

          </section>
        ) : null}

        {activeService === 'plumbing' ? (
          <section className="card">
            <h2>🚿 Сантехника</h2>
            <div className="stack">
              <Counter label="Унитаз" value={plumbing.toilet} onChange={(value) => setPlumbing((prev) => ({ ...prev, toilet: value }))} />
              <Counter label="Раковина" value={plumbing.sink} onChange={(value) => setPlumbing((prev) => ({ ...prev, sink: value }))} />
              <Counter label="Душ" value={plumbing.shower} onChange={(value) => setPlumbing((prev) => ({ ...prev, shower: value }))} />
              <Counter label="Ванна" value={plumbing.bathtub} onChange={(value) => setPlumbing((prev) => ({ ...prev, bathtub: value }))} />
              <Counter label="Бойлер" value={plumbing.boiler} onChange={(value) => setPlumbing((prev) => ({ ...prev, boiler: value }))} />
              <Counter
                label="Стиральная машина"
                value={plumbing.washer}
                onChange={(value) => setPlumbing((prev) => ({ ...prev, washer: value }))}
              />
            </div>

            <label className="input-label">
              Разводка труб (метры)
              <input type="number" min="0" value={plumbing.pipesMeters} onChange={updateNumberInput(setPlumbing, 'pipesMeters')} />
            </label>

            <label className="checkbox-single">
              <input
                type="checkbox"
                checked={plumbing.grooving}
                onChange={(event) => setPlumbing((prev) => ({ ...prev, grooving: event.target.checked }))}
              />
              Штробление
            </label>

            <button type="button" className="primary" onClick={handlePlumbingCalculate}>
              👉 Рассчитать
            </button>

            <div className="actions">
              <button type="button" onClick={resetToMain}>
                ⬅ На главный экран
              </button>
            </div>

          </section>
        ) : null}

        {hasEstimate ? (
          <section className="card summary-card">
            <h2>📋 Ваш расчёт</h2>
            {estimateItems.map((item) =>
              item.value ? (
                <p key={item.key}>
                  {item.label} — {getShortRangeLabel(item.value.min, item.value.max)}
                </p>
              ) : null,
            )}

            <hr />

            <h3>Итого: {getRangeLabel(estimateTotals.min, estimateTotals.max)}</h3>

            <div className="stack summary-actions">
              {estimate.finishing ? (
                <button
                  className="summary-button"
                  type="button"
                  onClick={() => {
                    setEstimate((prev) => ({ ...prev, finishing: null }));
                    setFinishing(INITIAL_FINISHING);
                    setFinishingStep(1);
                    setActiveService('finishing');
                  }}
                >
                  Пересчитать отделку
                </button>
              ) : null}

              {estimate.electric ? (
                <button
                  className="summary-button"
                  type="button"
                  onClick={() => {
                    setEstimate((prev) => ({ ...prev, electric: null }));
                    setElectric(INITIAL_ELECTRIC);
                    setActiveService('electric');
                  }}
                >
                  Пересчитать электрику
                </button>
              ) : null}

              {estimate.plumbing ? (
                <button
                  className="summary-button"
                  type="button"
                  onClick={() => {
                    setEstimate((prev) => ({ ...prev, plumbing: null }));
                    setPlumbing(INITIAL_PLUMBING);
                    setActiveService('plumbing');
                  }}
                >
                  Пересчитать сантехнику
                </button>
              ) : null}

              <button type="button" className="danger-button" onClick={handleEstimateReset}>
                Сбросить всё
              </button>
            </div>
          </section>
        ) : null}
      </main>

      <a className="instagram-fixed" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        Написать в Instagram
      </a>
    </div>
  );
}

export default App;
