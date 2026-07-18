import React, { useState, useEffect } from "react";
import { Button, Modal, Dropdown } from "antd";
import { UserAddOutlined, UsergroupAddOutlined, MoreOutlined } from '@ant-design/icons';
import { useEventContext, useEvent } from "../EventContext";
import AddContactOrGroup from "./AddContactOrGroup";

export default function CurrentUserCard() {
	const [userLogin, setUserLogin] = useState(null);
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

	const showAddEntryModal = (type) => {
		setEntryType(type);
		setShowModal(true);
	};

	const handleDataFromChild = (showModal) => {
		setShowModal(showModal);
	};

	const handleMenuClick = (e, key) => {
		e.domEvent.stopPropagation(); // Prevent container selection
		if (key === "logout") {
			addEvent("logout", true);
		} else if (key === "add_contact") {
			showAddEntryModal("contact");
		} else if (key === "create_group") {
			showAddEntryModal("group");
		}
		setDropdownVisible(false);
	};

	const items = [
		{
			label: "Añadir contacto",
			key: "add_contact",
			icon: <UserAddOutlined />,
		},
		{
			label: "Crear grupo",
			key: "create_group",
			icon: <UsergroupAddOutlined />,
		},
		{
			label: "Cerrar sesión",
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

	const menuProps = {
		items,
		onClick: (e) => handleMenuClick(e, e.key),
	};

	const handleDropdownVisibility = (visible) => {
		setDropdownVisible(visible);
	};

	const handleButtonClick = (e) => {
		e.stopPropagation(); // Prevent click from propagating to the contact container
		setDropdownVisible(!dropdownVisible); // Toggle dropdown visibility
	};

	return (
		<div className="flex w-full min-w-0 shrink-0 justify-between sm:items-center py-3 px-2 gap-2 bg-gray-100 border-t border-gray-200">
			{userLogin && (
				<div className="flex w-full min-w-0 relative rounded-lg items-center gap-2">
					<div className="flex-shrink-0">
						<img
							className="h-10 w-10 rounded-full bg-white"
							src={userLogin.image_profile}
							alt="default"
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
									title="Otros"
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