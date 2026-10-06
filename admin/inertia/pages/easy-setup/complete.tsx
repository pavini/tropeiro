import { Head, router } from '@inertiajs/react'
import AppLayout from '~/layouts/AppLayout'
import StyledButton from '~/components/StyledButton'
import Alert from '~/components/Alert'
import useInternetStatus from '~/hooks/useInternetStatus'
import useServiceInstallationActivity from '~/hooks/useServiceInstallationActivity'
import InstallActivityFeed from '~/components/InstallActivityFeed'
import ActiveDownloads from '~/components/ActiveDownloads'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import { useTranslation } from 'react-i18next'

export default function EasySetupWizardComplete() {
  const { t } = useTranslation()
  const { isOnline } = useInternetStatus()
  const installActivity = useServiceInstallationActivity()

  return (
    <AppLayout>
      <Head title={t('Easy Setup Wizard Complete')} />
      {!isOnline && (
        <Alert
          title={t('No Internet Connection')}
          message={t("It looks like you're not connected to the internet. Installing apps and downloading content will require an internet connection.")}
          type="warning"
          variant="solid"
          className="mb-8"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-surface-primary rounded-md shadow-md p-6">
          <StyledSectionHeader title={t('App Installation Activity')} className=" mb-4" />
          <InstallActivityFeed
            activity={installActivity}
            className="!shadow-none border-desert-stone-light border"
          />
          <ActiveDownloads withHeader />
          <Alert
            title={t('Running in the Background')}
            message={t('Feel free to leave this page at any time - your app installs and downloads will continue in the background! Please note, the Information Library (if installed) may be unavailable until all initial downloads complete.')}
            type="info"
            variant="solid"
            className='mt-12'
          />
          <div className="flex justify-center mt-8 pt-4 border-t border-desert-stone-light">
            <div className="flex space-x-4">
              <StyledButton onClick={() => router.visit('/home')} icon="IconHome">
                {t('Go to Home')}
              </StyledButton>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
