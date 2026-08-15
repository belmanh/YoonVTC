awk '
/Voyageur Nocturne/ {
    getline # skip Habitué Plateau
    getline # skip VIP Aéroport
    getline # skip closing div
    next
}
{ print }
' src/components/Passenger/PassengerApp.tsx > tmp_vip.tsx && mv tmp_vip.tsx src/components/Passenger/PassengerApp.tsx
