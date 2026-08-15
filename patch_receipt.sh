awk '
/Date & Heure/ {
    print "              <span className=\"text-[10px] text-slate-500 font-semibold uppercase\">Date du trajet</span>"
    print "              <p className=\"text-slate-200 font-semibold\">{dateFormatted}</p>"
    print "              <div className=\"flex items-center space-x-2 mt-1\">"
    print "                <div className=\"space-y-0.5\">"
    print "                  <span className=\"text-[9px] text-slate-500 uppercase\">Départ</span>"
    print "                  <p className=\"text-slate-400 text-[10px] font-mono\">{new Date(ride.startedAt || ride.createdAt).toLocaleTimeString(\"fr-FR\", {hour: \"2-digit\", minute: \"2-digit\"})}</p>"
    print "                </div>"
    print "                <div className=\"space-y-0.5\">"
    print "                  <span className=\"text-[9px] text-slate-500 uppercase\">Arrivée</span>"
    print "                  <p className=\"text-slate-400 text-[10px] font-mono\">{new Date(ride.completedAt || ride.createdAt).toLocaleTimeString(\"fr-FR\", {hour: \"2-digit\", minute: \"2-digit\"})}</p>"
    print "                </div>"
    print "              </div>"
    
    getline
    getline
    getline
    next
}
{ print }
' src/components/History/DigitalReceiptModal.tsx > tmp_receipt.tsx && mv tmp_receipt.tsx src/components/History/DigitalReceiptModal.tsx
