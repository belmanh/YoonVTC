awk '
/Passager Yoon VIP/ {
    print "            <div className=\"flex items-center space-x-1.5 mt-1\">"
    print "              <span className=\"px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[9px] rounded uppercase tracking-wider\">🌙 Voyageur Nocturne</span>"
    print "              <span className=\"px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] rounded uppercase tracking-wider\">🏙️ Habitué Plateau</span>"
    print "              <span className=\"px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-[9px] rounded uppercase tracking-wider\">✈️ VIP Aéroport</span>"
    print "            </div>"
    next
}
{ print }
' src/components/Passenger/PassengerApp.tsx > tmp_passenger2.tsx && mv tmp_passenger2.tsx src/components/Passenger/PassengerApp.tsx
