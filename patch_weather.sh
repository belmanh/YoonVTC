awk '
/Itinerary Metrics/ {
    print "            {/* Weather Widget */}"
    print "            <div className=\"flex items-center justify-between p-3 bg-gradient-to-r from-sky-100 to-indigo-100 dark:from-sky-900/40 dark:to-indigo-900/40 rounded-2xl border border-sky-200 dark:border-sky-800/50\">"
    print "              <div className=\"flex items-center space-x-3\">"
    print "                <div className=\"text-3xl\">🌤️</div>"
    print "                <div className=\"flex flex-col\">"
    print "                  <span className=\"text-xs font-bold text-sky-900 dark:text-sky-100\">Dakar, Sénégal</span>"
    print "                  <span className=\"text-[10px] text-sky-800/80 dark:text-sky-200/80 font-medium\">Partiellement nuageux</span>"
    print "                </div>"
    print "              </div>"
    print "              <div className=\"text-xl font-black text-sky-950 dark:text-white\">28°C</div>"
    print "            </div>\n"
}
{ print }
' src/components/Passenger/PassengerApp.tsx > tmp_passenger.tsx && mv tmp_passenger.tsx src/components/Passenger/PassengerApp.tsx
