import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText, ArrowLeft } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { KYCUploadForm } from "@/components/sms/KYCUploadForm";
import { useNavigate } from "react-router-dom";

const SenderIDKYCUpload = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSuccess = (response: any) => {
    setSuccessData(response);
    setUploadSuccess(true);
  };

  const handleError = (error: string) => {
    console.error('KYC Upload Error:', error);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 lg:p-3.5 xl:p-4">
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-3.5 lg:space-y-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-xs sm:text-sm mb-2"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {t("pg.Settings.0203")}
            </Button>

            {!uploadSuccess ? (
              <>
                {/* Header */}
                <div>
                  <h1 className="font-heading text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-foreground mb-1 sm:mb-1.5">
                    {t('sender_id_request') || t("pg.SenderIDKYCUpload.0801")}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                    {t('upload_kyc_documents') || t("pg.SenderIDKYCUpload.0802")}
                  </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Card className="p-2.5 sm:p-3.5 glass">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{t("pg.SenderIDKYCUpload.0803")}</p>
                        <p className="text-xs text-text-subtle mt-0.5">{t("pg.SenderIDKYCUpload.0804")}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-2.5 sm:p-3.5 glass">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{t("pg.SenderIDKYCUpload.0805")}</p>
                        <p className="text-xs text-text-subtle mt-0.5">{t("pg.SenderIDKYCUpload.0806")}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-2.5 sm:p-3.5 glass">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-success flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground">{t("pg.SenderIDKYCUpload.0807")}</p>
                        <p className="text-xs text-text-subtle mt-0.5">{t("pg.SenderIDKYCUpload.0808")}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Requirements */}
                <Card className="p-3 sm:p-4 glass">
                  <h2 className="font-semibold text-sm sm:text-base mb-3">{t("pg.SenderIDKYCUpload.0809")}</h2>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">1</div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-foreground">{t("pg.SenderNames.0580")}</p>
                        <p className="text-xs text-text-subtle">{t("pg.SenderIDKYCUpload.0810")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">2</div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-foreground">{t("pg.SenderNames.0594")}</p>
                        <p className="text-xs text-text-subtle">{t("pg.SenderIDKYCUpload.0811")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">3</div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-foreground">{t("pg.SenderNames.0597")}</p>
                        <p className="text-xs text-text-subtle">{t("pg.SenderIDKYCUpload.0812")}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Upload Form */}
                <KYCUploadForm onSuccess={handleSuccess} onError={handleError} />
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                    {t('submission_successful') || t("pg.SenderIDKYCUpload.0813")}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-subtle text-center max-w-md mb-6">
                    {t("pg.SenderIDKYCUpload.0814")}
                  </p>

                  {successData && (
                    <Card className="w-full max-w-md p-3 sm:p-4 glass mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs sm:text-sm text-text-subtle">{t("pg.SenderIDKYCUpload.0815")}</span>
                          <span className="text-xs sm:text-sm font-mono font-semibold text-foreground text-right flex-shrink-0 ml-2">{successData.id}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs sm:text-sm text-text-subtle">{t("pg.SenderNames.0580")}</span>
                          <span className="text-xs sm:text-sm font-semibold text-foreground text-right flex-shrink-0 ml-2">{successData.requested_sender_id}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs sm:text-sm text-text-subtle">{t("pg.Contacts.0352")}</span>
                          <Badge className="text-xs">
                            {successData.status === 'awaiting_payment' ? t("pg.SenderIDKYCUpload.0816") : successData.status}
                          </Badge>
                        </div>
                        {successData.kyc_documents && successData.kyc_documents.length > 0 && (
                          <div className="flex justify-between items-start">
                            <span className="text-xs sm:text-sm text-text-subtle">{t("pg.SenderIDKYCUpload.0803")}</span>
                            <span className="text-xs sm:text-sm font-semibold text-success">{successData.kyc_documents.length} {t("pg.SenderIDKYCUpload.0817")}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  <div className="flex gap-2 flex-col sm:flex-row w-full max-w-md">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="text-xs sm:text-sm flex-1"
                    >
                      {t("pg.SenderIDKYCUpload.0818")}
                    </Button>
                    <Button
                      onClick={() => {
                        setUploadSuccess(false);
                        setSuccessData(null);
                      }}
                      className="text-xs sm:text-sm flex-1"
                    >
                      {t("pg.SenderIDKYCUpload.0819")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenderIDKYCUpload;
