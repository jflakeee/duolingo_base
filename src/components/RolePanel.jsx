import { ROLE_LABELS, SELECTABLE_ROLES } from '../engine/roles.js'

// 역할 선택기 + (운영자) 관리 패널. 실제 보안 아님 — UX 게이팅용.
export default function RolePanel({ role, storedRole, isOperator, onSetRole, onGrantGems, onUnlockAll }) {
  return (
    <div className="role-panel">
      <div className="setting-row">
        <span>{isOperator ? '저장된 역할' : '역할'}</span>
        <div className="seg">
          {SELECTABLE_ROLES.map((r) => (
            <button key={r} className={`seg__btn ${storedRole === r ? 'seg__btn--on' : ''}`}
              onClick={() => onSetRole(r)}>{ROLE_LABELS[r]}</button>
          ))}
        </div>
      </div>

      {isOperator && (
        <div className="op-panel">
          <div className="op-panel__badge">🛠 운영자 모드 (개발용)</div>
          <div className="op-panel__actions">
            <button className="btn btn--sm btn--gold" onClick={() => onGrantGems(100)}>젬 +100</button>
            <button className="btn btn--sm btn--ghost" onClick={onUnlockAll}>전 레슨 잠금해제</button>
          </div>
        </div>
      )}
    </div>
  )
}
