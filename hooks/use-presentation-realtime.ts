"use client"

import { useEffect } from "react"
import { app } from "@/lib/firebase/client"
import { getDatabase, ref, onValue, off } from "firebase/database"; // For broadcast
import { getFirestore, doc, onSnapshot, query, collection, where } from "firebase/firestore"; // For postgres_changes equivalent

type UseRealtimeOpts = {
  presentationId: string
  slideId?: string
  onPresentationUpdate?: (payload: any) => void
  onResponse?: (payload: any) => void
  onSlideChange?: (payload: any) => void
  onControl?: (payload: any) => void
}

export function usePresentationRealtime({
  presentationId,
  slideId,
  onPresentationUpdate,
  onResponse,
  onSlideChange,
  onControl,
}: UseRealtimeOpts) {
  useEffect(() => {
    if (!presentationId) return

    // Firebase Realtime Database for control broadcasts
    const db = getDatabase(app);
    const controlRef = ref(db, `presentations/${presentationId}/control`);
    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      const payload = snapshot.val();
      if (payload) {
        onControl?.(payload) || onPresentationUpdate?.(payload);
      }
    });

    // Firestore for database changes (equivalent to postgres_changes)
    const firestore = getFirestore(app);

    // Presentation updates
    const presentationDocRef = doc(firestore, "presentations", presentationId);
    const unsubscribePresentation = onSnapshot(presentationDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        onPresentationUpdate?.({ new: docSnapshot.data() });
      }
    });

    // Responses
    const responsesQuery = query(
      collection(firestore, "responses"),
      where("presentation_id", "==", presentationId)
    );
    const unsubscribeResponses = onSnapshot(responsesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          if (!slideId || change.doc.data().slide_id === slideId) {
            onResponse?.({ new: change.doc.data() });
          }
        }
      });
    });

    // Slides updates
    const slidesQuery = query(
      collection(firestore, "slides"),
      where("presentation_id", "==", presentationId)
    );
    const unsubscribeSlides = onSnapshot(slidesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          onSlideChange?.({ new: change.doc.data() });
        }
      });
    });

    return () => {
      // Unsubscribe from Firebase listeners
      off(controlRef, 'value', unsubscribeControl); // Unsubscribe from Realtime Database
      unsubscribePresentation(); // Unsubscribe from Firestore presentation updates
      unsubscribeResponses(); // Unsubscribe from Firestore responses
      unsubscribeSlides(); // Unsubscribe from Firestore slides
    }
  }, [presentationId, slideId, onPresentationUpdate, onResponse, onSlideChange, onControl])
}
