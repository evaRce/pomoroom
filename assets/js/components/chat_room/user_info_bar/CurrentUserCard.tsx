import React, { useState, useEffect } from "react";
import { Button, Modal, Dropdown } from "antd";
import { UserAddOutlined, MoreOutlined } from '@ant-design/icons';
import { useEventContext } from "../EventContext";
import AddContactOrGroup from "./AddContactOrGroup";

export default function CurrentUserCard() {
	const [userLogin, setUserLogin] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const { addEvent, getEventData, removeEvent } = useEventContext();
	const [dropdownVisible, setDropdownVisible] = useState(false);

	useEffect(() => {
		const user = getEventData("show_user_info");
		if (user) {
			setUserLogin(user);
			// removeEvent("show_user_info");
		}
	}, [getEventData("show_user_info")]);

	const showAddEntryModal = () => {
		setShowModal(true);
	};

	const handleDataFromChild = (showModal) => {
		setShowModal(showModal);
	};

	const handleMenuClick = (e, key) => {
		e.domEvent.stopPropagation(); // Prevent container selection
		if (key === "logout") {
			addEvent("logout", true);
			setDropdownVisible(false);
			return;
		}
		setDropdownVisible(false);
	};

	const items = [
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
		<div className="flex h-[10vh] w-[20vw] justify-between sm:items-center py-7 px-2 gap-2 ">
			{userLogin && (
				<div className="flex relative rounded-lg items-center space-x-2 mb-1">
					<div className="flex-shrink-0">
						<img
							className="h-10 w-10 rounded-full bg-gray-100/25"
							src={userLogin.image_profile}
							alt="default"
							title={userLogin.nickname}
						/>
					</div>

					<div className="flex w-[18vw] items-center justify-between">
						<span className="hidden md:block lg:block overflow-ellipsis overflow-hidden whitespace-nowrap truncate  w-[2vw] md:w-[4vw] xl:w-[7vw]" title={userLogin.nickname}>
							{userLogin.nickname}
						</span>
						<div className="flex gap-1">
							<Button icon={<UserAddOutlined />} onClick={showAddEntryModal} title="Añadir contacto/grupo" />
							<Dropdown
								menu={menuProps}
								trigger={["click"]}
								open={dropdownVisible}
								onOpenChange={handleDropdownVisibility}
							>
								<Button
									icon={<MoreOutlined />}
									onClick={handleButtonClick}
									title="Otros"
								/>
							</Dropdown>
						</div>
					</div>
				</div>)
			}
			<AddContactOrGroup sendDataToParent={handleDataFromChild} receiveDataFromParent={showModal} />
		</div>
	);
}