export const PackageTabs = ({ activeTab, setActiveTab }: any) => {
  const tabs = [
    { id: 'itineraries', label: 'Itineraries', icon: '🗺️' },
    { id: 'policies', label: 'Policies', icon: '📜' },
    { id: 'summary', label: 'Summary', icon: '📋' }
  ];

  return (
    <div className="sticky top-20 z-30 bg-white border-b border-gray-100 shadow-sm font-opensans">
     <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 flex gap-8 my-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            // Updated: text-sm -> text-[18px] and added font-opensans
            className={`flex items-center gap-2 py-4 px-2 font-bold text-[16px] font-opensans transition-all border-b-2 ${
              activeTab === tab.id ? "border-[#C9A961] text-[#C9A961]" : "border-transparent text-gray-500"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};