import { PROFILE_TABS } from "../../../constants";
import type { PROFILE_TABS_TYPE } from "../../../types";
import styles from "./TabsBar.module.css";

interface TabsBarProps {
  active: PROFILE_TABS_TYPE;
  onSelect: (tab: PROFILE_TABS_TYPE) => void;
}

export function TabsBar({ active, onSelect }: TabsBarProps) {
  return (
    <div className={styles.tabsBar}>
      {PROFILE_TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          className={`${styles.tabBtn} ${active === tab ? styles.activeTab : ""}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
