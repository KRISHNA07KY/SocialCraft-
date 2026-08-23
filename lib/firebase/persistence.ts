import type { User } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, type DocumentData, type Timestamp } from "firebase/firestore";
import { firebaseFirestore } from "@/lib/firebase/client";
import type { Analysis } from "@/lib/analysis-schema";

export type ProfileRecord = { id: string; email: string | null; displayName: string | null; avatarUrl: string | null; createdAt: string; provider: string | null };
export type SessionRecord = { id: string; filename: string; file_type: string; extracted_text: string; ocr_confidence: number | null; analysis_result: Analysis; engagement_score: number; created_at: string };

function requireUser(user: User | null) {
  if (!user) throw new Error("Sign in to use your saved workspace.");
  return user;
}

function asDate(value: unknown, fallback = new Date().toISOString()) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate().toISOString();
  return fallback;
}

function persistenceError(error: unknown, fallback: string): never {
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") throw new Error("Firebase persistence is blocked by Firestore rules. Publish the included firestore.rules file.");
  if (code === "not-found" || code === "failed-precondition") throw new Error("Cloud Firestore is not enabled for this Firebase project yet. Enable it in Firebase Console.");
  throw new Error(fallback);
}

function profileFromData(user: User, data: DocumentData | undefined): ProfileRecord {
  return {
    id: user.uid,
    email: (data?.email as string | null | undefined) ?? user.email,
    displayName: (data?.displayName as string | null | undefined) ?? user.displayName,
    avatarUrl: (data?.avatarUrl as string | null | undefined) ?? user.photoURL,
    createdAt: asDate(data?.createdAt, user.metadata.creationTime || new Date().toISOString()),
    provider: (data?.provider as string | null | undefined) ?? user.providerData[0]?.providerId ?? null,
  };
}

export async function getUserProfile(user: User | null): Promise<ProfileRecord> {
  const currentUser = requireUser(user);
  const profileRef = doc(firebaseFirestore, "profiles", currentUser.uid);
  try {
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) {
      const profile = profileFromData(currentUser, undefined);
      await setDoc(profileRef, { ...profile, createdAt: profile.createdAt }, { merge: true });
      return profile;
    }
    return profileFromData(currentUser, snapshot.data());
  } catch (error) {
    return persistenceError(error, "We couldn't load your profile.");
  }
}

export async function updateUserProfile(user: User | null, displayName: string, avatarUrl: string | null): Promise<ProfileRecord> {
  const currentUser = requireUser(user);
  const profileRef = doc(firebaseFirestore, "profiles", currentUser.uid);
  try {
    await setDoc(profileRef, { displayName, avatarUrl }, { merge: true });
    const snapshot = await getDoc(profileRef);
    return profileFromData(currentUser, snapshot.data());
  } catch (error) {
    return persistenceError(error, "We couldn't update your profile.");
  }
}

function sessionFromData(id: string, data: DocumentData): SessionRecord {
  return {
    id,
    filename: String(data.filename || "Untitled analysis"),
    file_type: String(data.fileType || "unknown"),
    extracted_text: String(data.extractedText || ""),
    ocr_confidence: typeof data.ocrConfidence === "number" ? data.ocrConfidence : null,
    analysis_result: data.analysisResult as Analysis,
    engagement_score: Number(data.engagementScore || 0),
    created_at: asDate(data.createdAt),
  };
}

export async function listAnalysisSessions(user: User | null): Promise<SessionRecord[]> {
  const currentUser = requireUser(user);
  try {
    const sessionsRef = collection(firebaseFirestore, "users", currentUser.uid, "analysisSessions");
    const snapshot = await getDocs(query(sessionsRef, orderBy("createdAt", "desc")));
    return snapshot.docs.map((item) => sessionFromData(item.id, item.data()));
  } catch (error) {
    return persistenceError(error, "We couldn't load your history.");
  }
}

export async function getAnalysisSession(user: User | null, id: string): Promise<SessionRecord> {
  const currentUser = requireUser(user);
  try {
    const snapshot = await getDoc(doc(firebaseFirestore, "users", currentUser.uid, "analysisSessions", id));
    if (!snapshot.exists()) throw new Error("That analysis was not found.");
    return sessionFromData(snapshot.id, snapshot.data());
  } catch (error) {
    if (error instanceof Error && error.message === "That analysis was not found.") throw error;
    return persistenceError(error, "We couldn't load that analysis.");
  }
}

export async function saveAnalysisSession(user: User | null, input: { filename: string; fileType: string; extractedText: string; ocrConfidence: number | null; analysis: Analysis }) {
  const currentUser = requireUser(user);
  try {
    const reference = await addDoc(collection(firebaseFirestore, "users", currentUser.uid, "analysisSessions"), {
      filename: input.filename,
      fileType: input.fileType,
      extractedText: input.extractedText,
      ocrConfidence: input.ocrConfidence,
      analysisResult: input.analysis,
      engagementScore: input.analysis.engagementScore,
      createdAt: serverTimestamp(),
    });
    return { id: reference.id, createdAt: new Date().toISOString() };
  } catch (error) {
    return persistenceError(error, "Your analysis is ready, but it couldn't be saved to history.");
  }
}

export async function submitFeedback(user: User | null, email: string, message: string) {
  const currentUser = requireUser(user);
  try {
    await addDoc(collection(firebaseFirestore, "feedback"), { userId: currentUser.uid, email: email || currentUser.email || null, message, createdAt: serverTimestamp() });
  } catch (error) {
    return persistenceError(error, "We couldn't send your feedback. Please try again.");
  }
}
