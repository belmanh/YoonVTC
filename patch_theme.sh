# Remove isNightMode toggle button and state
sed -i 's/const \[isNightMode, setIsNightMode\] = useState(true);//' src/components/Passenger/PassengerApp.tsx
sed -i 's/bg-slate-950/bg-[#0B0F19]/' src/components/Passenger/PassengerApp.tsx
sed -i 's/bg-slate-900/bg-[#111827]/' src/components/Passenger/PassengerApp.tsx
sed -i 's/bg-slate-800/bg-[#1F2937]/' src/components/Passenger/PassengerApp.tsx

# Find and remove the moon/sun button
awk '/\{\/\* Bouton Night Mode \*\/\}/ {
    getline
    getline
    getline
    getline
    getline
    getline
    next
}
{ print }' src/components/Passenger/PassengerApp.tsx > tmp_theme.tsx && mv tmp_theme.tsx src/components/Passenger/PassengerApp.tsx

# Also apply blue & pink nuances to the app wrapper
sed -i 's/<div className={`flex flex-col h-full bg-\[#0B0F19\] text-slate-100 relative overflow-hidden font-sans select-none ${isNightMode ? '\''dark'\'' : '\'''\''}`}/<div className="flex flex-col h-full bg-[#090b14] text-slate-100 relative overflow-hidden font-sans select-none dark before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] before:from-pink-900\/20 before:via-[#090b14]\/0 before:to-[#090b14]\/0 after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] after:from-blue-900\/20 after:via-[#090b14]\/0 after:to-[#090b14]\/0">/g' src/components/Passenger/PassengerApp.tsx
