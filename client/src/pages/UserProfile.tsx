import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, User, Heart, Shield, AlertTriangle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type GenderValue = "male" | "female" | "other" | "prefer_not_to_say" | undefined;

interface ProfileFormData {
  fullName: string;
  dateOfBirth: string;
  gender: GenderValue;
  bloodType: string;
  phone: string;
  address: string;
  nationality: string;
  occupation: string;
  allergies: string;
  currentMedications: string;
  chronicConditions: string;
  pastSurgeries: string;
  familyHistory: string;
  medicalNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const initialFormData: ProfileFormData = {
  fullName: "",
  dateOfBirth: "",
  gender: undefined,
  bloodType: "",
  phone: "",
  address: "",
  nationality: "",
  occupation: "",
  allergies: "",
  currentMedications: "",
  chronicConditions: "",
  pastSurgeries: "",
  familyHistory: "",
  medicalNotes: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

function validatePhone(phone: string): boolean {
  if (!phone) return true; // optional
  return /^09\d{7,10}$/.test(phone);
}

function validateDate(date: string): boolean {
  if (!date) return true; // optional
  const d = new Date(date);
  return !isNaN(d.getTime());
}

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Profile data
  const profileQuery = trpc.profile.get.useQuery();
  const updateMutation = trpc.profile.update.useMutation();

  useEffect(() => {
    if (profileQuery.data?.profile) {
      const p = profileQuery.data.profile;
      setFormData({
        fullName: p.fullName || "",
        dateOfBirth: p.dateOfBirth || "",
        gender: (p.gender as GenderValue) || undefined,
        bloodType: p.bloodType || "",
        phone: p.phone || "",
        address: p.address || "",
        nationality: p.nationality || "",
        occupation: p.occupation || "",
        allergies: p.allergies || "",
        currentMedications: p.currentMedications || "",
        chronicConditions: p.chronicConditions || "",
        pastSurgeries: p.pastSurgeries || "",
        familyHistory: p.familyHistory || "",
        medicalNotes: p.medicalNotes || "",
        emergencyContactName: p.emergencyContactName || "",
        emergencyContactPhone: p.emergencyContactPhone || "",
      });
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (profileQuery.error) {
      setFetchError(profileQuery.error.message);
    }
  }, [profileQuery.error]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Validate phone
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Invalid phone format. Use 09xxxxxxxxx";
    }

    // Validate date
    if (formData.dateOfBirth && !validateDate(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Invalid date";
    }

    // Validate emergency contact
    if (formData.emergencyContactName && !formData.emergencyContactPhone) {
      newErrors.emergencyContactPhone = "Phone number required if name is provided";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors before saving");
      return;
    }

    // Clean empty strings to undefined for optional fields
    const cleanData: Partial<ProfileFormData> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "" && value !== undefined) {
        (cleanData as Record<string, unknown>)[key] = value;
      }
    });

    updateMutation.mutate(cleanData, {
      onSuccess: () => {
        toast.success("Profile updated successfully!");
        setErrors({});
        profileQuery.refetch();
      },
      onError: (error) => {
        toast.error(`Failed to update profile: ${error.message}`);
      },
    });
  };

  const account = profileQuery.data?.account;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-3 md:px-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">My Profile</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Manage your personal and medical information</p>
            </div>
          </div>
          <a href="/chat" className="text-sm text-blue-400 hover:text-blue-300 transition-colors shrink-0">
            Back
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-4 md:py-6 px-3 md:px-4 max-w-4xl">
        {profileQuery.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Failed to load profile</h3>
            <p className="text-sm text-muted-foreground mt-2">{fetchError}</p>
            <Button onClick={() => profileQuery.refetch()} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Summary Card */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg md:text-2xl font-bold shrink-0">
                    {formData.fullName ? formData.fullName.charAt(0) : (user?.name?.charAt(0) || "U")}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base md:text-xl truncate">
                      {formData.fullName || user?.name || "Myanmar User"}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {user?.email} · {user?.role === "admin" ? "Administrator" : "User"}
                    </CardDescription>
                    {account && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Member since {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full bg-muted/50">
                <TabsTrigger value="personal" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Personal Info</span>
                  <span className="sm:hidden">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <Heart className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Medical Records</span>
                  <span className="sm:hidden">Medical</span>
                </TabsTrigger>
                <TabsTrigger value="emergency" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <Shield className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Emergency</span>
                  <span className="sm:hidden">Contact</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name (အမည်)</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleChange("fullName", e.target.value)}
                          placeholder="သင့်အမည်"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender (လိင်)</Label>
                        <select
                          id="gender"
                          value={formData.gender || ""}
                          onChange={(e) => handleChange("gender", e.target.value || "")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth (မွေးဖွားရက်)</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                          className={`bg-background ${errors.dateOfBirth ? "border-red-400" : ""}`}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {errors.dateOfBirth}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bloodType">Blood Type (သွေးအုပ်စု)</Label>
                        <select
                          id="bloodType"
                          value={formData.bloodType}
                          onChange={(e) => handleChange("bloodType", e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select blood type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (ဖုန်းနံပတ်)</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          placeholder="09xxxxxxxxx"
                          className={`bg-background ${errors.phone ? "border-red-400" : ""}`}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality (နိုင်ငံသား)</Label>
                        <Input
                          id="nationality"
                          value={formData.nationality}
                          onChange={(e) => handleChange("nationality", e.target.value)}
                          placeholder="Myanmar"
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation (အလုပ်အကိုင်)</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => handleChange("occupation", e.target.value)}
                        placeholder="သင့်အလုပ်အကိုင်"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address (လိပ်စာ)</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="သင့်လိပ်စာ"
                        rows={3}
                        className="bg-background"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medical Records Tab */}
              <TabsContent value="medical" className="space-y-4 mt-4">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-400" />
                      Medical Summary (ဆေးမှတ်တမ်း အကျဉ်းချုပ်)
                    </CardTitle>
                    <CardDescription>
                      Your medical history helps the AI provide more accurate and personalized responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="allergies" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        Allergies (ဓာတ်မတည့်ခြင်းများ)
                      </Label>
                      <Textarea
                        id="allergies"
                        value={formData.allergies}
                        onChange={(e) => handleChange("allergies", e.target.value)}
                        placeholder="ဓာတ်မတည့်တဲ့အရာများ (ဥပမာ - ပင်နီဆီလင်၊ ပြားငါး)..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="chronicConditions">Chronic Conditions (နာတာရှည်ရောဂါများ)</Label>
                      <Textarea
                        id="chronicConditions"
                        value={formData.chronicConditions}
                        onChange={(e) => handleChange("chronicConditions", e.target.value)}
                        placeholder="သွေးတိုးရောဂါ၊ သကြားရောဂါ၊ နှလုံးရောဂါ စသည်..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentMedications">Current Medications (လက်ရှိသောက်နေသော ဆေးများ)</Label>
                      <Textarea
                        id="currentMedications"
                        value={formData.currentMedications}
                        onChange={(e) => handleChange("currentMedications", e.target.value)}
                        placeholder="ဆေးနာမည်၊ ပမာဏ၊ အချိန်..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pastSurgeries">Past Surgeries (ခွဲစိတ်မှု မှတ်တမ်း)</Label>
                      <Textarea
                        id="pastSurgeries"
                        value={formData.pastSurgeries}
                        onChange={(e) => handleChange("pastSurgeries", e.target.value)}
                        placeholder="ခွဲစိတ်မှုများ၊ ခွဲစိတ်မှုရက်စွဲ..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="familyHistory">Family Medical History (မိသားစု ရောဂါရာဇဝင်)</Label>
                      <Textarea
                        id="familyHistory"
                        value={formData.familyHistory}
                        onChange={(e) => handleChange("familyHistory", e.target.value)}
                        placeholder="မိဘ၊ မောင်နှမ များ၏ ရောဂါရာဇဝင်..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicalNotes">Additional Medical Notes (အခြား မှတ်ချက်များ)</Label>
                      <Textarea
                        id="medicalNotes"
                        value={formData.medicalNotes}
                        onChange={(e) => handleChange("medicalNotes", e.target.value)}
                        placeholder="အခြား သိထားသင့်သော ကျန်းမာရေး အချက်အလက်များ..."
                        rows={3}
                        className="bg-background"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Emergency Contact Tab */}
              <TabsContent value="emergency" className="space-y-4 mt-4">
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      Emergency Contact (အရေးပေါ် အဆက်အသွယ်)
                    </CardTitle>
                    <CardDescription>
                      In case of emergency, we will contact this person
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Contact Name (အမည်)</Label>
                        <Input
                          id="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                          placeholder="အရေးပေါ် ဆက်သွယ်ရမည့်သူ အမည်"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Contact Phone (ဖုန်းနံပတ်)</Label>
                        <Input
                          id="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                          placeholder="09xxxxxxxxx"
                          className={`bg-background ${errors.emergencyContactPhone ? "border-red-400" : ""}`}
                        />
                        {errors.emergencyContactPhone && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {errors.emergencyContactPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end pt-4 pb-6 md:pb-8">
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 w-full sm:w-auto"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save Profile</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
