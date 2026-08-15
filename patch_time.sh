awk '
/Itinerary Metrics/ {
    print "            {/* Time Estimation */}"
    print "            <div className=\"grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 mb-4\">"
    print "              <div className=\"space-y-0.5\">"
    print "                <p className=\"text-[10px] text-slate-400 uppercase font-semibold\">Départ immédiat</p>"
    print "                <p className=\"text-sm font-black text-white\">{new Date().toLocaleTimeString(\"fr-FR\", {hour: \"2-digit\", minute: \"2-digit\"})}</p>"
    print "              </div>"
    print "              <div className=\"space-y-0.5\">"
    print "                <p className=\"text-[10px] text-slate-400 uppercase font-semibold\">Arrivée estimée</p>"
    print "                <p className=\"text-sm font-black text-white\">{new Date(Date.now() + estimate.durationMinutes * 60000).toLocaleTimeString(\"fr-FR\", {hour: \"2-digit\", minute: \"2-digit\"})}</p>"
    print "              </div>"
    print "            </div>"
    print ""
    print $0
    next
}
{ print }
' src/components/Passenger/PassengerApp.tsx > tmp_time.tsx && mv tmp_time.tsx src/components/Passenger/PassengerApp.tsx
