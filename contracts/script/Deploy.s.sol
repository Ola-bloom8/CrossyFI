// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PostcardNFT.sol";
import "../src/PostcardRouter.sol";

/// @notice Deploy PostcardNFT + PostcardRouter on a given chain
/// @dev Set SPOKE_POOL env var to the Across SpokePool address for the target chain
///      Base Sepolia SpokePool: 0x82B564983aE7274c86695917BBf8C99ECb6F0F8
///      Arb Sepolia SpokePool:  0x7E63A5f1a8F0B4d0934B2f2327DAED3F6bb2ee75
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address spokePool = vm.envAddress("SPOKE_POOL");
        string memory chainName = vm.envString("CHAIN_NAME");

        vm.startBroadcast(deployerKey);

        PostcardNFT nft = new PostcardNFT();
        PostcardRouter router = new PostcardRouter(spokePool, address(nft), chainName);
        nft.setPaymentRouter(address(router));

        vm.stopBroadcast();

        console.log("PostcardNFT deployed at:", address(nft));
        console.log("PostcardRouter deployed at:", address(router));
    }
}
