import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { C, SANS, SERIF } from "../constants";
import { useCommunityStore } from "../store/useCommunityStore";
import { useCommunityData } from "../hooks/useCommunityData";
import { useCommunitySearch } from "../hooks/useCommunitySearch";
import { useCommunityNavigation } from "../hooks/useCommunityNavigation";
import { Grain } from "../../../components/shared/Grain";
import { Navbar } from "./shared/Navbar";
import { ListCard } from "./shared/ListCard";
import { OfficialListCard } from "./shared/OfficialListCard";
import { OfficialBadge } from "./shared/OfficialBadge";
import { EmptyMyLists } from "./shared/EmptyMyLists";
import { CreateListModal } from "./shared/CreateListModal";
import { Hero } from "./Hero";
import { FilterBar } from "./FilterBar";

const TABS = [
  { id: "all", label: "Todas" },
  { id: "official", label: "Oficiales" },
  { id: "friends", label: "Amigos" },
  { id: "mine", label: "Mis listas" },
] as const;

const SORT_OPTIONS = [
  { id: "popular", label: "Más populares" },
  { id: "recent", label: "Más recientes" },
  { id: "alphabetical", label: "Alfabético" },
] as const;

export default function CommunityDiscover() {
  const { refresh } = useCommunityData();
  const { filteredLists, officials } = useCommunitySearch();
  const navigation = useCommunityNavigation();

  const { activeTab, modalOpen, setModalOpen } = navigation;
  const { myLists, currentUser, loading, searchQuery, setSearchQuery } = useCommunityStore();

  const showOfficialRow = activeTab === "all" || activeTab === "official";
  const showEmptyMine = activeTab === "mine" && myLists.length === 0 && !loading;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Grain />
      <Navbar user={currentUser} />
      
      <CreateListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRefresh={refresh}
      />

      <Hero onOpenModal={() => setModalOpen(true)} />

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 40px" }}>
        <AnimatePresence>
          {showOfficialRow && officials.length > 0 && (
            <motion.section
              key="official-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: 0.6 }}
              style={{ paddingTop: 44, paddingBottom: 48 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                <OfficialBadge size="lg" />
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.border}, transparent)` }} />
                <span style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted }}>{officials.length} listas</span>
              </div>
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
                {officials.map((list, i) => <OfficialListCard key={list.id} list={list} index={i} />)}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <FilterBar
          {...navigation}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tabs={TABS}
          sortOptions={SORT_OPTIONS}
          showBorder={showOfficialRow}
        />

        <motion.section layout>
          <div style={{ marginBottom: 22 }}>
            <span style={{ fontFamily: SANS, fontSize: 10, color: C.textMuted }}>
              {searchQuery ? `${filteredLists.length} resultados para "${searchQuery}"` : `${filteredLists.length} listas`}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {showEmptyMine ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <EmptyMyLists onCreateClick={() => setModalOpen(true)} />
              </div>
            ) : filteredLists.length === 0 && !loading ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: C.textSoft }}>No hay resultados</p>
                <button onClick={() => setSearchQuery("")} style={{ marginTop: 16, background: "none", border: `1px solid ${C.border}`, color: C.accent, fontFamily: SANS, fontSize: 10, padding: "9px 20px", cursor: "pointer" }}>Limpiar</button>
              </div>
            ) : (
              <motion.div key="grid" layout style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, paddingBottom: 80 }}>
                {filteredLists.map((list, i) => <ListCard key={list.id} list={list} index={i} />)}
                {(activeTab === "all" || activeTab === "friends") && !searchQuery && (
                  <motion.div onClick={() => setModalOpen(true)} whileHover={{ borderColor: C.accentDim, background: "rgba(212,175,122,0.025)" }} style={{ background: C.surface, border: `1px dashed ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer", padding: "48px 24px", minHeight: 260 }}>
                    <div style={{ width: 44, height: 44, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accentDim }}><Plus size={18} /></div>
                    <div style={{ textAlign: "center" }}><p style={{ fontFamily: SERIF, fontSize: 17, color: C.textSoft, margin: "0 0 5px" }}>Curar una lista</p><p style={{ fontFamily: SANS, fontSize: 9, color: C.textMuted, textTransform: "uppercase" }}>Crear nueva colección</p></div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>
    </div>
  );
}
