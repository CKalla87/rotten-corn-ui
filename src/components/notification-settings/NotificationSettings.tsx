import { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cloneDeep } from 'lodash';
import Button from '@components/button/Button';
import Toggle from '@components/toggle/Toggle';
import { notificationItems } from '@services/utils/static.data';
import { userService } from '@services/api/user/user.service';
import { Utils } from '@services/utils/utils.service';
import type { RootState, AppDispatch } from '@redux/store';
import '@components/notification-settings/NotificationSettings.scss';

const NotificationSettings = () => {
  const { profile } = useSelector((state: RootState) => state.user);
  const [notificationTypes, setNotificationTypes] = useState(notificationItems);
  const [notificationSettings, setNotificationSettings] = useState(profile?.notifications);
  const dispatch = useDispatch<AppDispatch>();

  const mapNotificationTypesToggle = useCallback(
    (notifications: typeof notificationItems) => {
      for (const notification of notifications) {
        const toggled = notificationSettings?.[notification.type as keyof typeof notificationSettings];
        notification.toggle = toggled !== undefined ? (toggled as boolean) : notification.toggle;
      }
      setNotificationTypes(notifications);
    },
    [notificationSettings]
  );

  const updateNotificationTypesToggle = (itemIndex: number) => {
    const updatedData = notificationTypes.map((item, index) => {
      if (index === itemIndex) {
        return {
          ...item,
          toggle: !item.toggle
        };
      }
      return item;
    });
    setNotificationTypes(updatedData);
  };

  const sendNotificationSettings = async () => {
    try {
      const response = await userService.updateNotificationSettings(notificationSettings);
      if (response) {
        Utils.dispatchNotification(response.data.message, 'success', dispatch);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      Utils.dispatchNotification(axiosError?.response?.data?.message || 'An error occurred', 'error', dispatch);
    }
  };

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      mapNotificationTypesToggle(notificationItems);
    }, 0);
  }, [mapNotificationTypesToggle, notificationTypes]);

  return (
    <>
      <div className="notification-settings">
        {notificationTypes.map((data, index) => (
          <div className="notification-settings-container" key={data.index} data-testid="notification-settings-item">
            <div className="notification-settings-container-sub-card">
              <div className="notification-settings-container-sub-card-body">
                <h6 className="title">{`${data.title}`}</h6>
                <div className="subtitle-body">
                  <p className="subtext">{data.description}</p>
                </div>
              </div>
              <div className="toggle" data-testid="toggle-container">
                <Toggle
                  toggle={data.toggle}
                  onClick={() => {
                    updateNotificationTypesToggle(index);
                    const clonedSettings = cloneDeep(notificationSettings) as Record<string, unknown>;
                    if (clonedSettings) {
                      const currentValue = clonedSettings[data.type];
                      clonedSettings[data.type] = !currentValue;
                      setNotificationSettings(clonedSettings);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="btn-group">
          <Button label="Update" className="update" disabled={false} handleClick={sendNotificationSettings} />
        </div>
      </div>
      <div style={{ height: '1px' }}></div>
    </>
  );
};

export default NotificationSettings;
