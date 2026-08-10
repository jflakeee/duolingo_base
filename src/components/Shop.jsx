import { PRICE_HEART_REFILL, PRICE_STREAK_FREEZE, MAX_FREEZES } from '../engine/economy.js'

export default function Shop({ progress, onBuyHearts, onBuyFreeze }) {
  const heartsFull = progress.hearts >= 5
  const freezeFull = progress.streak.freezes >= MAX_FREEZES
  return (
    <div className="tabscreen">
      <h1>상점 🛒</h1>
      <p className="lede">보유 젬: 💎 {progress.gems}</p>

      <div className="shop-item">
        <div className="shop-item__ico">❤️</div>
        <div className="shop-item__body">
          <strong>하트 가득 채우기</strong>
          <p className="lede">{heartsFull ? '이미 가득 찼어요' : '하트를 5개로 회복'}</p>
        </div>
        <button className="btn btn--sm" disabled={heartsFull || progress.gems < PRICE_HEART_REFILL} onClick={onBuyHearts}>
          💎 {PRICE_HEART_REFILL}
        </button>
      </div>

      <div className="shop-item">
        <div className="shop-item__ico">🧊</div>
        <div className="shop-item__body">
          <strong>스트릭 프리즈</strong>
          <p className="lede">결석 하루를 보호해요 (최대 {MAX_FREEZES}개, 보유 {progress.streak.freezes})</p>
        </div>
        <button className="btn btn--sm btn--blue" disabled={freezeFull || progress.gems < PRICE_STREAK_FREEZE} onClick={onBuyFreeze}>
          💎 {PRICE_STREAK_FREEZE}
        </button>
      </div>
    </div>
  )
}
