import React, { useState, useEffect } from "react";
import { Button, Modal, Dropdown, type MenuProps } from "antd";
import { UserAddOutlined, UsergroupAddOutlined, MoreOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from "react-i18next";
import { useEventContext, useEvent } from "../EventContext";
import AddContactOrGroup from "./AddContactOrGroup";
import { logoutAction, setLocaleAction } from "../../../services/userService";
import { EventBusPayload } from "../../../types/events";
import useUserInfoBarText from "./userInfoBarText";
import { SUPPORTED_LOCALES, normalizeLocale } from "../../../i18n";

export default function CurrentUserCard() {
	const userInfoBarText = useUserInfoBarText();
	const { t, i18n } = useTranslation();
	const [userLogin, setUserLogin] = useState<EventBusPayload<"show_user_info"> | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [entryType, setEntryType] = useState("contact");
	const { addEvent } = useEventContext();
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const userInfoEvent = useEvent("show_user_info");

	useEffect(() => {
		if (userInfoEvent) {
			setUserLogin(userInfoEvent);
		}
	}, [userInfoEvent]);

	const showAddEntryModal = (type: string) => {
		setEntryType(type);
		setShowModal(true);
	};

	const handleDataFromChild = (showModal: boolean) => {
		setShowModal(showModal);
	};

	const currentLocale = normalizeLocale(i18n.language);
	const nextLocale = SUPPORTED_LOCALES.find((locale) => locale !== currentLocale) || currentLocale;

	const handleMenuClick = (key: string) => {
		if (key === "logout") {
			logoutAction(addEvent);
		} else if (key === "add_contact") {
			showAddEntryModal("contact");
		} else if (key === "create_group") {
			showAddEntryModal("group");
		} else if (key === "change_language") {
			i18n.changeLanguage(nextLocale);
			setLocaleAction(addEvent, nextLocale);
		}
		setDropdownVisible(false);
	};

	const items = [
		{
			label: userInfoBarText.menu.addContact,
			key: "add_contact",
			icon: <UserAddOutlined />,
		},
		{
			label: userInfoBarText.menu.createGroup,
			key: "create_group",
			icon: <UsergroupAddOutlined />,
		},
		{
			label: `${t("common.changeLanguage")} (${currentLocale.toUpperCase()})`,
			key: "change_language",
			icon: <GlobalOutlined />,
		},
		{
			label: userInfoBarText.menu.logout,
			key: "logout",
			icon:
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					fill="currentColor"
					className="bi bi-box-arrow-left"
					viewBox="0 0 16 16"
				>
					<path
						fillRule="evenodd"
						d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z"
					/>
					<path
						fillRule="evenodd"
						d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z"
					/>
				</svg>,
		},
	];

	const menuProps: MenuProps = {
		items,
		onClick: (e) => {
			e.domEvent.stopPropagation(); // Prevent container selection
			handleMenuClick(e.key);
		},
	};

	const handleDropdownVisibility = (visible: boolean) => {
		setDropdownVisible(visible);
	};

	const handleButtonClick = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent click from propagating to the contact container
		setDropdownVisible(!dropdownVisible); // Toggle dropdown visibility
	};

	return (
		<div className="flex w-full min-w-0 shrink-0 justify-between sm:items-center py-3 landscape-sm:py-1.5 px-2 gap-2 bg-gray-100 border-t border-gray-200">
			{userLogin && (
				<div className="flex w-full min-w-0 relative rounded-lg items-center gap-2">
					<div className="flex-shrink-0">
						<img
							className="h-10 w-10 landscape-sm:h-8 landscape-sm:w-8 rounded-full bg-white"
							src={userLogin.image_profile}
							alt={userInfoBarText.defaultAvatarAlt}
							title={userLogin.nickname}
						/>
					</div>

					<div className="flex flex-1 min-w-0 items-center justify-between gap-2">
						<span className="block overflow-ellipsis overflow-hidden whitespace-nowrap truncate min-w-0 flex-1" title={userLogin.nickname}>
							{userLogin.nickname}
						</span>
						<div className="flex gap-3 shrink-0">
							<Dropdown
								menu={menuProps}
								trigger={["click"]}
								open={dropdownVisible}
								onOpenChange={handleDropdownVisibility}
							>
								<Button
									className="bg-white"
									icon={<MoreOutlined />}
									onClick={handleButtonClick}
									title={userInfoBarText.others}
									aria-label={userInfoBarText.others}
								/>
							</Dropdown>
						</div>
					</div>
				</div>)
			}
			<AddContactOrGroup sendDataToParent={handleDataFromChild} receiveDataFromParent={showModal} entryType={entryType} />
		</div>
	);
}